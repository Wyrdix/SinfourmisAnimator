import { Node, PossibleCanvasStyle, Rect, RectProps, Txt } from "@motion-canvas/2d";
import { createSignal, ThreadGenerator, Vector2 } from "@motion-canvas/core";
import { EnvConfig, WorldData } from "./DataType";
import { WorldNode } from "./WorldNode";
import { WorldEdge } from "./WorldEdge";

export interface WorldProps extends RectProps {
    data: WorldData;
    config: EnvConfig;
    fixed_size: Vector2;
    colorizer: (v: number) => PossibleCanvasStyle;
}

export interface AnimationGenerator {
    generator: (timing: number) => ThreadGenerator
    type: "SCORE_UPDATE" | "EDGE_MOVEMENT" | "ON_NODE_LINK" | "ON_NODE_UNLINK" | "NODE_UPDATE" | "FOOD_UPDATE"
}

export class World extends Rect {

    fileScale: Vector2;
    fileTranslate: Vector2;
    preferredNodeSize: number;

    data: WorldData;
    colorizer: (v: number) => PossibleCanvasStyle;
    fixed_size: Vector2;
    generators: AnimationGenerator[]

    public constructor(props: WorldProps) {
        super({ ...props, width: props.fixed_size.x, height: props.fixed_size.y });
        this.data = props.data;
        this.fixed_size = props.fixed_size;
        this.colorizer = props.colorizer;
        this.generators = [];

        this.refreshFileScale();
        this.refresh();

        if (props.config.hud === true) {
            const team_node = <Node></Node>
            const team_count = this.data.teams.size;

            const positions: Vector2[] = (
                team_count == 2 ? [[-1, 1], [1, 1]]
                    : team_count == 3 ? [[-1, 1], [1, 1], [0, -1]]
                        : team_count == 4 ? [[-1, 1], [1, 1], [-1, -1], [1, -1]]
                            : team_count == 5 ? [[-1, 1], [0, 1], [1, 1], [-1, -1], [1, -1]]
                                : team_count == 6 ? [[-1, 1], [0, 1], [1, 1], [-1, -1], [0, -1], [1, -1]]
                                    : team_count == 7 ? [[-1, 1], [0, 1], [1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
                                        : team_count == 8 ? [[-1, 1], [0, 1], [1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0]] : []).map(v => new Vector2(v as [number, number]))


            this.data.teams.forEach((v, i) => {
                const pos = positions[i - 1].mul([this.getWidth() / 2, -this.getHeight() / 2]);
                const score = createSignal(v.score);
                team_node.add(
                    <Rect position={pos} size={20} offset={positions[i - 1].mul([1, -1])}>
                        <Txt text={v.name} offset={positions[i - 1].mul([1, -1])} fill={v.color} />
                        <Txt text={() => score().toFixed()} offset={positions[i - 1].mul([1, -1])} y={-60 * (pos.y > 0 ? 1 : -1)} fill={"white"} />
                    </Rect>
                )

                if (v.next) this.generators.push({ generator: (t) => score(v.next.score, t), type: "SCORE_UPDATE" });
            })

            this.add(team_node);
        }
    }

    fromWorldToRect(position: Vector2) {
        position = position.mul(this.fileScale);
        position = position.add(this.fileTranslate);
        return position;
    }

    refreshFileScale() {

        let minPos: undefined | [number, number] = undefined;
        let maxPos: undefined | [number, number] = undefined;
        let sumPos: [number, number] = [0, 0];

        this.data.nodes.forEach((node, k, m) => {
            if (!minPos) minPos = [node.x, node.y]
            if (!maxPos) maxPos = [node.x, node.y]

            minPos[0] = Math.min(minPos[0], node.x)
            minPos[1] = Math.min(minPos[1], node.y)
            maxPos[0] = Math.max(maxPos[0], node.x)
            maxPos[1] = Math.max(maxPos[1], node.y)

            sumPos[0] += node.x;
            sumPos[1] += node.y;
        });

        if (!minPos || !maxPos) throw new Error();

        const n = this.data.nodes.size;

        this.fileScale = new Vector2([(this.fixed_size.x / 2 - 20) / (Math.max(maxPos[0] - minPos[0], 1)), (this.fixed_size.y / 2 - 20) / (Math.max(maxPos[1] - minPos[1], 1))]);
        this.fileTranslate = new Vector2(- sumPos[0] / n * this.fileScale.x, - sumPos[1] / n * this.fileScale.y);
        this.preferredNodeSize = 10 * Math.min(Math.min(this.fileScale.x, this.fileScale.y), 20);
    }

    refresh() {
        this.refreshFileScale();
        this.removeChildren();

        const thisRef = this;

        this.data.get_edges().forEach((v) => {
            const { id_1: i, id_2: j, life_ratio } = v;

            const node_i = this.data.nodes.get(i);
            const node_j = this.data.nodes.get(j);

            if (!node_i || !node_j) return

            thisRef.add(
                new WorldEdge(
                    {
                        world: thisRef,
                        edgeData: v
                    }
                )
            )
        })

        this.data.nodes.forEach((node, k) => {

            let position = thisRef.fromWorldToRect(new Vector2(node.x, node.y));

            thisRef.add(
                new WorldNode({ world: this, node: node, position: position, size: this.preferredNodeSize })
            );

            // thisRef.add(
            //     new Txt({ position: position, size: this.preferredNodeSize, fill: "orange", text: k.toString() })
            // )
        });

    }
}
