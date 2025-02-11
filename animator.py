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
    parser.add_argument("-g", "--group", type=int, default=100)
    parser.add_argument("-t", "--time", type=float, default=1)
    parser.add_argument("--hud", choices=["False", "True"], default="True")
    
    args = parser.parse_args()

    sp.run(["npm", "i"], stdout=sp.DEVNULL, stderr=sp.STDOUT)
    sp.run(["mkdir", "data"], stdout=sp.DEVNULL, stderr=sp.STDOUT)
    sp.run(["rm", "-f", "./data/world.json"])
    sp.run(["cp", args.filename, "data/world.json"])

    obj = json.load(open("./data/world.json"))
    N = len(obj["data"])
    end = args.end
    if(end == -1):
        end = N
    sp.run(["rm", "-rf", "output"])

    dir = os.path.dirname(os.path.realpath(__file__))
    for start in range(args.start, end, args.group):
        env = os.environ.copy()
        env["VITE_ANIMCONFIG"] = json.dumps({
            "colorizer": args.colorizer,
            "render_start": start,
            "render_end": min(start + args.group, end+1),
            "time_per_step": args.time,
            "hud": args.hud == "True"
        })
        segment = dict([(k, obj["data"][k]) for k in obj["data"] if start <= (int(k)) < min(start + args.group, end+1)])
        json.dump({"data" : segment}, open("./data/world.json", "w"))

        sp.run(["rm", "-rf", "output/project"])
        sp.run(["npm", "run", "test"], env=env)
        sp.run(["rm", "-f", "video.mp4"])
        sp.run(["ffmpeg","-i","output/project/%6d.png", "-vcodec","libx264", "-crf", "22","video.mp4"], stdout=sp.DEVNULL, stderr=sp.STDOUT)
        print("Rendered ", start, "to", min(args.start + args.group, end))
        sp.run(["mv", "video.mp4", "output/"+str(round(start/args.group))+"_video.mp4"])


        sp.run(["rm","-f", "lists.txt"])
        sp.run(["rm","-f", "output.mp4"])
        with open("lists.txt", "w") as f:
            f.writelines(["file 'output/"+str(i)+"_video.mp4'\n" for i in range(0, 1+int((start-args.start)/args.group))])

        sp.run(["ffmpeg","-f", "concat", "-i", "lists.txt", "-c", "copy", "output.mp4"])