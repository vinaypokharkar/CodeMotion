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




class CombinedGenerateRenderRequest(BaseModel):
    prompt: str
    scene_class: str = "GeneratedScene"
    quality: str = "low"
    filename: str = "script.py"
    max_retries: int = 2  # number of retries on validation/render failure


class CombinedGenerateRenderResponse(BaseModel):
    success: bool
    filename: str | None = None
    local_path: str | None = None
    supabase_url: str | None = None
    code: str | None = None
    sanitized_code: str | None = None
    error: str | None = None
    logs: dict | None = None


def retry_validation(code: str, max_retries: int = 2) -> tuple[bool, str | None, str | None]:
    """
    Validate code with retry logic.
    Returns: (success: bool, sanitized_code: str | None, error: str | None)
    """
    for attempt in range(max_retries + 1):
        try:
            result = sanitize_and_validate(code)
            if result.get("ok"):
                return True, result.get("sanitized_code"), None
            else:
                errors = result.get("errors", [])
                error_msg = f"Validation failed: {', '.join(errors)}"
                if attempt < max_retries:
                    print(f"Attempt {attempt + 1} failed: {error_msg}. Retrying...")
                else:
                    return False, None, error_msg
        except Exception as e:
            error_msg = f"Validation exception: {str(e)}"
            if attempt < max_retries:
                print(f"Attempt {attempt + 1} failed: {error_msg}. Retrying...")
            else:
                return False, None, error_msg
    
    return False, None, "Validation failed after all retries"


def fix_manim_code(code: str, error_msg: str) -> str | None:
    """
    Attempt to fix common Manim errors in generated code.
    Returns fixed code or None if no fix could be applied.
    """
    fixed_code = code
    
    # Fix 1: Replace FRAME_X / FRAME_Y with WIDTH / HEIGHT (or remove them)
    if "FRAME_X" in error_msg or "FRAME_Y" in error_msg or "FRAME_WIDTH" in error_msg or "FRAME_HEIGHT" in error_msg:
        print("Detected FRAME_X/Y issue, attempting to fix...")
        # Replace FRAME_X with common values
        fixed_code = fixed_code.replace("FRAME_X / 2", "4")  # Half width
        fixed_code = fixed_code.replace("FRAME_X", "8")        # Full width
        fixed_code = fixed_code.replace("FRAME_Y / 2", "2.25") # Half height
        fixed_code = fixed_code.replace("FRAME_Y", "4.5")      # Full height
        fixed_code = fixed_code.replace("FRAME_WIDTH", "8")
        fixed_code = fixed_code.replace("FRAME_HEIGHT", "4.5")
        return fixed_code
    
    # Fix 2: Missing imports
    if "NameError" in error_msg or "is not defined" in error_msg:
        if "rate_functions" in error_msg or "ease_in_quad" in error_msg:
            if "from manim import rate_functions" not in fixed_code:
                fixed_code = "from manim import rate_functions\n" + fixed_code
                print("Added rate_functions import")
                return fixed_code
    
    # Fix 3: Simplify to basic shapes if complex code fails
    if "construct" in error_msg.lower():
        print("Detected construct error, could simplify animation...")
        # This is a fallback for complex errors
        return None
    
    return None


def retry_render(code: str, filename: str, scene_class: str, quality: str, max_retries: int = 2) -> tuple[bool, str | None, dict | None]:
    """
    Render code with retry logic and auto-fix attempts.
    Returns: (success: bool, dest_path: str | None, logs: dict | None)
    """
    current_code = code
    
    for attempt in range(max_retries + 1):
        tmp = tempfile.mkdtemp(prefix="manimjob-")
        try:
            script_path = os.path.join(tmp, filename)
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(current_code)

            quality_flag = {"low": "-ql", "medium": "-pqm", "high": "-pqh"}.get(quality, "-ql")
            out_name = "render"
            cmd = [
                "docker", "run", "--rm",
                "--read-only=false",
                "--network", "none",
                "-v", f"{tmp}:/work",
                "manim-image:latest",
                quality_flag, f"/work/{filename}", scene_class,
                "--media_dir", "/work/media",
                "-o", out_name
            ]

            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
            stdout = proc.stdout.decode(errors="ignore")
            stderr = proc.stderr.decode(errors="ignore")

            if proc.returncode != 0:
                error_output = stderr + "\n" + stdout
                logs = {"stdout": stdout, "stderr": stderr}
                
                # Check for infrastructure/container errors (not code errors)
                is_container_error = (
                    "KeyboardInterrupt" in error_output or
                    "ConnectionError" in error_output or
                    "ConnectionRefusedError" in error_output or
                    "docker" in error_output.lower() and "error" in error_output.lower()
                )
                
                # Check for code-related errors
                is_code_error = (
                    "NameError" in error_output or
                    "AttributeError" in error_output or
                    "TypeError" in error_output or
                    "ImportError" in error_output or
                    "IndentationError" in error_output or
                    "SyntaxError" in error_output
                )
                
                print(f"Attempt {attempt + 1} failed. Container error: {is_container_error}, Code error: {is_code_error}")
                
                # Try to fix code errors
                if is_code_error and attempt < max_retries:
                    fixed = fix_manim_code(current_code, error_output)
                    if fixed and fixed != current_code:
                        print(f"Attempt {attempt + 1}: Auto-fix applied. Retrying with fixed code...")
                        current_code = fixed
                        try:
                            shutil.rmtree(tmp)
                        except Exception:
                            pass
                        continue
                
                # Retry container errors (might be transient)
                if is_container_error and attempt < max_retries:
                    print(f"Attempt {attempt + 1}: Container error detected. Retrying...")
                    try:
                        shutil.rmtree(tmp)
                    except Exception:
                        pass
                    time.sleep(2)  # Wait before retrying
                    continue
                
                error_msg = f"Docker render failed with return code {proc.returncode}"
                if is_container_error:
                    error_msg += " (Container/Environment Error - may be transient)"
                print(f"Final error: {error_msg}")
                return False, None, logs

            # Find the generated MP4 file
            mp4_path = None
            for root, dirs, files in os.walk(tmp):
                for fn in files:
                    if fn.endswith(".mp4"):
                        mp4_path = os.path.join(root, fn)
                        break
                if mp4_path:
                    break

            if not mp4_path or not os.path.exists(mp4_path):
                error_msg = "No MP4 file produced by Manim"
                logs = {"stdout": stdout, "stderr": stderr}
                if attempt < max_retries:
                    print(f"Attempt {attempt + 1} failed: {error_msg}. Retrying...")
                else:
                    return False, None, logs
                try:
                    shutil.rmtree(tmp)
                except Exception:
                    pass
                continue

            # Save the video
            dest_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_videos")
            os.makedirs(dest_dir, exist_ok=True)
            dest_filename = f"{out_name}-{uuid.uuid4().hex[:8]}.mp4"
            dest_path = os.path.join(dest_dir, dest_filename)
            
            try:
                shutil.copy2(mp4_path, dest_path)
            except Exception as copy_err:
                error_msg = f"Failed to save video: {str(copy_err)}"
                logs = {"stdout": stdout, "stderr": stderr}
                if attempt < max_retries:
                    print(f"Attempt {attempt + 1} failed: {error_msg}. Retrying...")
                else:
                    return False, None, logs
                try:
                    shutil.rmtree(tmp)
                except Exception:
                    pass
                continue


            return True, dest_path, {"stdout": stdout, "stderr": stderr}

        except subprocess.TimeoutExpired:
            error_msg = "Render timed out after 10 minutes"
            print(f"Attempt {attempt + 1} failed: {error_msg}")
            if attempt < max_retries:
                print("Retrying...")
                try:
                    shutil.rmtree(tmp)
                except Exception:
                    pass
                time.sleep(1)
            else:
                return False, None, {"error": error_msg}
        except Exception as e:
            error_msg = f"Render exception: {str(e)}"
            print(f"Attempt {attempt + 1} failed: {error_msg}")
            if attempt < max_retries:
                print("Retrying...")
                try:
                    shutil.rmtree(tmp)
                except Exception:
                    pass
                time.sleep(1)
            else:
                return False, None, {"error": error_msg}
        finally:
            try:
                shutil.rmtree(tmp)
            except Exception:
                pass
    
    return False, None, {"error": "Render failed after all retries"}


@app.post("/generate-and-render", response_model=CombinedGenerateRenderResponse)
async def generate_and_render(req: CombinedGenerateRenderRequest) -> CombinedGenerateRenderResponse:
    """
    Combined endpoint: prompt → generate code → validate → render video → upload to Supabase
    Includes retry logic for validation and rendering.
    """
    try:
        print(f"\n=== Combined Generate-Render Request ===")
        print(f"Prompt: {req.prompt}")
        
        # Step 1: Generate code from prompt using LLM
        print("Step 1: Generating code from prompt...")
        try:
            llm_result = generate_manim_code(req.prompt)
            generated_code = llm_result.get("code", "")
            print(f"Generated {len(generated_code)} characters of code")
        except Exception as e:
            error_msg = f"LLM generation failed: {str(e)}"
            print(f"ERROR: {error_msg}")
            return CombinedGenerateRenderResponse(
                success=False,
                error=error_msg,
                code=None
            )
        
        # Step 2: Validate & sanitize code with retry
        print("Step 2: Validating code with retry logic...")
        valid, sanitized_code, validation_error = retry_validation(generated_code, max_retries=req.max_retries)
        if not valid:
            error_msg = f"Code validation failed: {validation_error}"
            print(f"ERROR: {error_msg}")
            return CombinedGenerateRenderResponse(
                success=False,
                error=error_msg,
                code=generated_code
            )
        print("Code validation passed")
        
        # Step 3: Render video with retry
        print("Step 3: Rendering video with retry logic...")
        render_success, dest_path, logs = retry_render(
            sanitized_code,
            req.filename,
            req.scene_class,
            req.quality,
            max_retries=req.max_retries
        )
        
        if not render_success:
            error_msg = f"Render failed: {logs.get('error') or 'Unknown error'}"
            print(f"ERROR: {error_msg}")
            return CombinedGenerateRenderResponse(
                success=False,
                error=error_msg,
                code=generated_code,
                sanitized_code=sanitized_code,
                logs=logs
            )
        print(f"Render successful: {dest_path}")
        
        # Step 4: Upload to Supabase
        supabase_url = None
        try:
            if _supabase is not None:
                bucket = SUPABASE_BUCKET
                dest_name = f"{uuid.uuid4().hex[:8]}-{os.path.basename(dest_path)}"
                print(f"Step 4: Uploading to Supabase bucket '{bucket}'...")
                
                with open(dest_path, "rb") as f:
                    result = _supabase.storage.from_(bucket).upload(dest_name, f)
                    print(f"Upload result: {result}")

                supabase_url = _supabase.storage.from_(bucket).get_public_url(dest_name)
                print(f"Supabase public URL: {supabase_url}")
            else:
                print("Step 4: Supabase not configured, skipping upload")
        except Exception as e:
            print(f"WARNING: Supabase upload failed: {type(e).__name__}: {e}")
            # Don't fail the entire request if upload fails

        print(f"=== Success ===\n")
        return CombinedGenerateRenderResponse(
            success=True,
            filename=os.path.basename(dest_path),
            local_path=dest_path,
            supabase_url=supabase_url,
            code=generated_code,
            sanitized_code=sanitized_code,
            logs=logs
        )

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"ERROR: {error_msg}")
        import traceback
        traceback.print_exc()
        return CombinedGenerateRenderResponse(
            success=False,
            error=error_msg
        )


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
