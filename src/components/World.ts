import { Circle, Rect, RectProps } from "@motion-canvas/2d";
import { WorldNodeData, NodeType } from "./WorldNode";
import { useLogger, Vector2 } from "@motion-canvas/core";

export interface WorldData {
    nodes: Map<number, WorldNodeData>,
    edges: [number, number][],
}

export function parseWorld(lines:string[]) : WorldData {
    const n: number = Number.parseInt(lines[0]);

    const map = new Map<number, WorldNodeData>();
    let consumed = 1;
    for (let i = 0; i < n; i++) {
        let real_i = consumed + i;
        let v = lines[real_i];
        let raw_id;

        [raw_id, v] = lines[real_i].split(":");
        v = v.trim();

        const id = Number.parseInt(raw_id);

        let raw_world_x, raw_world_y, raw_type, params:string[];
        [raw_world_x, raw_world_y, raw_type, ...params] = v.split(" ");

        const world_x = Number.parseInt(raw_world_x);
        const world_y = Number.parseInt(raw_world_y);
        const type = raw_type as NodeType

        map.set(id, {
            id,
            world_x,
            world_y,
            type
        });
    }

    consumed += n;
    return {nodes: map, edges: []};
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

        useLogger().info(JSON.stringify(minPos));
        useLogger().info(JSON.stringify(maxPos));
    }

    refresh(){
        this.refreshFileScale();
        this.removeChildren();
        
        const thisRef = this;

        this.data.nodes.forEach((node, k, m) => {
            thisRef.add(
                new Circle({x: node.world_x * this.fileScale.x + this.fileTranslate.x, y:node.world_y * this.fileScale.y + this.fileTranslate.y, size:this.preferredNodeSize, lineWidth:2, stroke:"white"})
            );
        });
    }
}