import { Circle, Line, Rect, RectProps } from "@motion-canvas/2d";
import { WorldNodeData, NodeType } from "./WorldNode";
import { Color, useLogger, Vector2 } from "@motion-canvas/core";

export interface EdgeData {
    i:number,
    j:number,
    life_ratio: number
}

export interface WorldData {
    nodes: Map<number, WorldNodeData>,
    edges: EdgeData[],
}

export function parseWorld(lines:string[]) : WorldData {
    lines = lines.map((v) => {
        return v.includes("#") ? (v.substring(0, v.indexOf("#"))) : v
    }).filter((v)=>v.trim() != "");

    // Parse nodes

    let node_begin = lines.findIndex((v)=>v.trim() == "== NODES") as number
    let node_end = lines.findIndex((v)=>v.trim() == "== END NODES") as number

    const map = new Map<number, WorldNodeData>();
    for (let i = node_begin+1; i < node_end; i++) {
        let v = lines[i];
        let raw_id;

        let id = i - node_begin - 1;

        if (v.includes(":")){
            [raw_id, v] = v.split(":");    
            id = Number.parseInt(raw_id);
        }

        v = v.trim();

        let raw_world_x, raw_world_y, raw_type, params:string[];
        [raw_world_x, raw_world_y, raw_type, ...params] = v.split(" ");

        const world_x = Number.parseInt(raw_world_x);
        const world_y = -Number.parseInt(raw_world_y);
        const type = (raw_type || "EMPTY") as NodeType

        map.set(id, {
            id,
            world_x,
            world_y,
            type
        });
    }

    // Parse edges

    let edges_begin = lines.findIndex((v)=>v.trim() == "== EDGES") as number
    let edges_end = lines.findIndex((v)=>v.trim() == "== END EDGES") as number
    const edges: EdgeData[] = [];

    for (let i = edges_begin+1; i < edges_end; i++) {
        let v = lines[i].trim();

        let raw_v0, raw_v1, raw_life_ratio, rest: string[];

        [raw_v0, raw_v1, raw_life_ratio, ...rest] = v.split(" ");

        edges.push({
            i:Number.parseInt(raw_v0),
            j:Number.parseInt(raw_v1),
            life_ratio: Math.min(Math.max(raw_life_ratio ? Number.parseFloat(raw_life_ratio) : 1.0, 0), 1.0)
        });
    }

    return {nodes: map, edges: edges};
}

export interface WorldProps extends RectProps {
    data: WorldData;
    fixed_size: Vector2;

}

export class World extends Rect {

    fileScale: Vector2;
    fileTranslate: Vector2;
    preferredNodeSize: number;

    data: WorldData;
    fixed_size: Vector2;


    public constructor(props: WorldProps) {
        super({...props, width:props.fixed_size.x, height:props.fixed_size.y});
        this.data = props.data;
        this.fixed_size = props.fixed_size;

        this.refreshFileScale();
    }

    fromWorldToRect(position: Vector2){
        position = position.mul(this.fileScale);
        position = position.add(this.fileTranslate);
        return position;
    }

    refreshFileScale() {

        let minPos: undefined | [number, number] = undefined;
        let maxPos: undefined | [number, number] = undefined;
        let sumPos: [number, number] = [0, 0];

        this.data.nodes.forEach((node, k, m) => {
            console.log(node.id)
            if (!minPos) minPos = [node.world_x, node.world_y]
            if (!maxPos) maxPos = [node.world_x, node.world_y]

            minPos[0] = Math.min(minPos[0], node.world_x)
            minPos[1] = Math.min(minPos[1], node.world_y)
            maxPos[0] = Math.max(maxPos[0], node.world_x)
            maxPos[1] = Math.max(maxPos[1], node.world_y)

            sumPos[0] += node.world_x;
            sumPos[1] += node.world_y;
        });

        if (!minPos || !maxPos) throw new Error();

        const n = this.data.nodes.size;

        this.fileScale = new Vector2([(this.fixed_size.x/2 - 20) / (maxPos[0] - minPos[0]), (this.fixed_size.y/2-20) / (maxPos[1] - minPos[1])]);
        this.fileTranslate = new Vector2( - sumPos[0] / n * this.fileScale.x, - sumPos[1]/n * this.fileScale.y);
        this.preferredNodeSize = 10 * Math.min(this.fileScale.x, this.fileScale.y);
    }

    refresh(){
        this.refreshFileScale();
        this.removeChildren();
        
        const thisRef = this;

        this.data.edges.forEach((v)=>{
            const {i, j, life_ratio} = v;

            const node_i = this.data.nodes.get(i);
            const pos_i = thisRef.fromWorldToRect(new Vector2(node_i.world_x, node_i.world_y));
            const node_j = this.data.nodes.get(j);
            const pos_j = thisRef.fromWorldToRect(new Vector2(node_j.world_x, node_j.world_y));

            thisRef.add(
                new Line(
                    {
                        points: [pos_i, pos_j],
                        lineWidth: this.preferredNodeSize*0.2,
                        stroke: Color.lerp("black", "white", life_ratio)
                    }
                )
            )
        })

        this.data.nodes.forEach((node, k, m) => {

            let position = thisRef.fromWorldToRect(new Vector2(node.world_x, node.world_y));
            
            thisRef.add(
                new Circle({key:node.id+"", position:position, size:this.preferredNodeSize, lineWidth:4, stroke:"white", fill:"black"})
            );
        });
    }
}