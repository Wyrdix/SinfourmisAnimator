import subprocess as sp
import os
import sys
import json
import argparse as ap
from tendo import singleton

if __name__ == "__main__":
    try:
        me = singleton.SingleInstance()
    except:
        print("Already running")
        sys.exit(-1)
    parser = ap.ArgumentParser(prog="Animator", description="Script to execute Sinfourmis Animator")
    parser.add_argument("filename")
    parser.add_argument("-c", "--colorizer", choices=["8Bit", "File"])
    parser.add_argument("-s", "--start", type=int, default=0)
    parser.add_argument("-e", "--end", type=int, default=-1)
    
    args = parser.parse_args()

    sp.run(["rm", "-f", "./data/world.json"])
    sp.run(["cp", args.filename, "data/world.json"])
    sp.run(["npm", "i"], stdout=sp.DEVNULL, stderr=sp.STDOUT)
    env = os.environ.copy()
    env["VITE_ANIMCONFIG"] = json.dumps({
        "colorizer": args.colorizer,
        "render_start": args.start,
        "render_end": args.end
    })
    sp.run(["rm", "-f", "video.mp4"])
    sp.run(["npm", "run", "test"], env=env)
    sp.run(["ffmpeg","-i","output/project/%6d.png", "-vcodec","libx264", "-crf", "22","video.mp4"])
    sp.run(["rm", "-rf", "./output/project"])