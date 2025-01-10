import subprocess as sp
import os
import json

if __name__ == "__main__":
    sp.run(["npm", "i"], stdout=sp.DEVNULL, stderr=sp.STDOUT)
    env = os.environ.copy()
    env["VITE_ANIMCONFIG"] = json.dumps({
        "colorizer": None,
        "render_start": 0,
        "render_end": 10
    })
    sp.run(["npm", "run", "test"], env=env)
    sp.run(["ffmpeg","-i","output/project/%6d.png", "-vcodec","libx264", "-crf", "22","video.mp4"])