import { Circle, NodeProps, Shape, ShapeProps } from "@motion-canvas/2d";
import { SignalValue } from "@motion-canvas/core";

export type NodeType = "EMPTY" | "FOOD" | "LIQUID"

export interface WorldNodeData {
    id: number,
    world_x: number,
    world_y: number
    type: NodeType
}

export class WorldNode extends Shape {
    data: WorldNodeData;

    public constructor(props: ShapeProps, data: WorldNodeData) {
        super(props);
        this.data = data;

        this.add(new Circle(props));
    }
}