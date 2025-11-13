# api/app.py
import os
import tempfile
import subprocess
import shutil
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
import ast
from fastapi.responses import FileResponse, JSONResponse
from llm_generate import generate_manim_code
from validator import sanitize_and_validate
import threading
import time
try:
    from supabase import create_client
except Exception:
    create_client = None

# Run with Docker (loads .env for GENAI_API_KEY, etc.)
# docker run --env-file .env -p 8000:8000 your-fastapi-image

app = FastAPI(title="Simple Manim Runner")

# Supabase client initialization (optional)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "videos")
if SUPABASE_URL and SUPABASE_KEY and create_client is not None:
    try:
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print("Failed to initialize Supabase client:", e)
        _supabase = None
else:
    _supabase = None

class PromptIn(BaseModel):
    prompt: str

class GenerateResponse(BaseModel):
    path: str
    code: str
    metadata: dict

class ValidationRequest(BaseModel):
    code: str

class ValidationResponse(BaseModel):
    ok: bool
    errors: list[str] | None = None
    sanitized_code: str | None = None

@app.post("/generate", response_model=GenerateResponse)
def generate_endpoint(req: PromptIn) -> GenerateResponse:
    try:
        print(req.prompt)
        result = generate_manim_code(req.prompt)
        return GenerateResponse(
            path=result["path"],
            code=result.get("code", ""),
            metadata=result.get("metadata", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        print(result)

        

# Lightweight AST safety: forbid dangerous names/imports
FORBIDDEN = {"os", "sys", "subprocess", "socket", "open", "__import__", "eval", "exec", "shutil", "pathlib"}

def is_code_safe(code: str):
    try:
        tree = ast.parse(code)
    except Exception as e:
        return False, f"parse_error: {e}"
    for node in ast.walk(tree):
        # imports
        if isinstance(node, ast.Import):
            for n in node.names:
                if n.name.split(".")[0] in FORBIDDEN:
                    return False, f"forbidden import {n.name}"
        if isinstance(node, ast.ImportFrom):
            if (node.module or "").split(".")[0] in FORBIDDEN:
                return False, f"forbidden import from {node.module}"
        # names
        if isinstance(node, ast.Name):
            if node.id in FORBIDDEN:
                return False, f"forbidden name {node.id}"
        # attribute access e.g., os.system
        if isinstance(node, ast.Attribute):
            attr = getattr(node, "attr", None)
            if attr in FORBIDDEN:
                return False, f"forbidden attribute {attr}"
    return True, "ok"

class CodeRequest(BaseModel):
    filename: str = "script.py"      # optional name
    code: str
    scene_class: str = "GeneratedScene"  # class name of the Scene to render
    quality: str = "low"             # low/medium/high (affects manim flags)


@app.post("/validate", response_model=ValidationResponse)
def validate_endpoint(req: ValidationRequest) -> ValidationResponse:
    result = sanitize_and_validate(req.code)
    if result.get("ok"):
        return ValidationResponse(ok=True, sanitized_code=result.get("sanitized_code"))
    return ValidationResponse(
        ok=False,
        errors=result.get("errors", []),
        sanitized_code=result.get("sanitized_code"),
    )



@app.post("/render")
async def render_code(req: CodeRequest):
    safe, msg = is_code_safe(req.code)
    if not safe:
        raise HTTPException(status_code=400, detail=f"code rejected: {msg}")

    # make temp dir
    tmp = tempfile.mkdtemp(prefix="manimjob-")
    try:
        script_path = os.path.join(tmp, req.filename)
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(req.code)

        # determine manim quality flags (adjust frame rate / resolution per quality)
        # our Docker image's entrypoint is `manim`
        # -p: preview, -ql quick low quality, -qm medium quality, -qh high quality
        quality_flag = {"low": "-ql", "medium": "-pqm", "high": "-pqh"}.get(req.quality, "-pql")

        out_name = "render"
        cmd = [
            "docker", "run", "--rm",
            "--read-only=false",
            "--network", "none",             # no network inside container
            "-v", f"{tmp}:/work",
            "manim-image:latest",
            quality_flag, f"/work/{req.filename}", req.scene_class,
            "--media_dir", "/work/media",   # ensure manim writes to /work
            "-o", out_name
        ]

        # Optionally add CPU/memory limits
        # Example: add ['--cpus', '0.8', '--memory', '1g'] to cmd before image name if desired

        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
        stdout = proc.stdout.decode(errors="ignore")
        stderr = proc.stderr.decode(errors="ignore")

        if proc.returncode != 0:
            return JSONResponse(status_code=500, content={"error": "render failed", "stdout": stdout, "stderr": stderr})

        # manim by default outputs to media/videos/<script>/<quality>/<out_name>.mp4
        # Let's search under /work/media for a .mp4
        mp4_path = None
        for root, dirs, files in os.walk(tmp):
            for fn in files:
                if fn.endswith(".mp4"):
                    mp4_path = os.path.join(root, fn)
                    break
            if mp4_path:
                break

        if not mp4_path or not os.path.exists(mp4_path):
            return JSONResponse(status_code=500, content={"error": "no mp4 produced", "stdout": stdout, "stderr": stderr})

        # Persist a copy of the rendered video under a dedicated directory
        dest_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_videos")
        os.makedirs(dest_dir, exist_ok=True)
        dest_filename = f"{out_name}-{uuid.uuid4().hex[:8]}.mp4"
        dest_path = os.path.join(dest_dir, dest_filename)
        try:
            shutil.copy2(mp4_path, dest_path)
        except Exception as copy_err:
            # If copy fails, still attempt to return original from temp
            return FileResponse(mp4_path, media_type="video/mp4", filename=os.path.basename(mp4_path))

        # Attempt to upload the saved video to Supabase (if configured)
        supabase_url = None
        try:
            if _supabase is not None:
                # create a destination name inside the bucket
                bucket = SUPABASE_BUCKET
                dest_name = f"{uuid.uuid4().hex[:8]}-{os.path.basename(dest_path)}"
                print(f"Uploading to Supabase bucket '{bucket}' with name '{dest_name}'")
                
                with open(dest_path, "rb") as f:
                    # upload file-like object
                    result = _supabase.storage.from_(bucket).upload(dest_name, f)
                    print(f"Upload result: {result}")

                # get public URL - this returns a string directly, not a dict
                supabase_url = _supabase.storage.from_(bucket).get_public_url(dest_name)
                print(f"Supabase public URL: {supabase_url}")
                
                if supabase_url:
                    print(f"Uploaded video to Supabase: {supabase_url}")
                else:
                    print("Warning: Supabase returned empty URL")
            else:
                print("Supabase client not initialized. Check SUPABASE_URL and SUPABASE_KEY env vars")
        except Exception as e:
            # don't fail the request if upload fails; log and continue
            print(f"Supabase upload failed: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

        # return metadata JSON containing local file info and Supabase URL (if uploaded)
        response = {
            "filename": os.path.basename(dest_path),
            "local_path": dest_path,
            "supabase_url": supabase_url,
        }
        return JSONResponse(status_code=200, content=response)
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="render timed out")
    finally:
        # Keep temp for debugging? remove it.
        try:
            shutil.rmtree(tmp)
        except Exception:
            pass


@app.get("/videos/{filename}")
def download_video(filename: str):
    """Serve a previously generated video file from `generated_videos/`."""
    dest_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_videos")
    path = os.path.join(dest_dir, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="video/mp4", filename=filename)


@app.get("/debug/supabase")
def debug_supabase():
    """Debug endpoint to check Supabase configuration."""
    return {
        "supabase_url": SUPABASE_URL or "NOT SET",
        "supabase_key": "***" if SUPABASE_KEY else "NOT SET",
        "supabase_bucket": SUPABASE_BUCKET,
        "client_initialized": _supabase is not None,
        "create_client_available": create_client is not None,
    }
