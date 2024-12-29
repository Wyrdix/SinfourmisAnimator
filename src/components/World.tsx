import { Circle, CircleProps, Gradient, Layout, Line, LineProps, Node, Polygon, Rect, RectProps, Shape, Txt } from "@motion-canvas/2d";
import { Color, useLogger, Vector2 } from "@motion-canvas/core";
import { EdgeData, NodeData, WorldData } from "./DataType";

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
        super({ ...props, width: props.fixed_size.x, height: props.fixed_size.y });
        this.data = props.data;
        this.fixed_size = props.fixed_size;

        this.refreshFileScale();
        this.refresh();

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


        this.add(team_node);
        this.data.teams.forEach((v, i) => {
            const pos = positions[i - 1].mul([this.getWidth() / 2, -this.getHeight() / 2]);

            team_node.add(
                <Rect position={pos} size={20} offset={positions[i - 1].mul([1, -1])}>
                    <Txt text={v.name} offset={positions[i - 1].mul([1, -1])} fill={v.color} />
                    <Txt text={v.score.toString()} offset={positions[i - 1].mul([1, -1])} y={-60 * (pos.y > 0 ? 1 : -1)} fill={"white"} />
                </Rect>
            )
        })

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

        this.fileScale = new Vector2([(this.fixed_size.x / 2 - 20) / (maxPos[0] - minPos[0]), (this.fixed_size.y / 2 - 20) / (maxPos[1] - minPos[1])]);
        this.fileTranslate = new Vector2(- sumPos[0] / n * this.fileScale.x, - sumPos[1] / n * this.fileScale.y);
        this.preferredNodeSize = 10 * Math.min(this.fileScale.x, this.fileScale.y);
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

        this.data.nodes.forEach((node, k, m) => {

            let position = thisRef.fromWorldToRect(new Vector2(node.x, node.y));

            thisRef.add(
                new WorldNode({ world: this, node: node, position: position, size: this.preferredNodeSize })
            );
        });
    }
}

export interface WorldNodeProps extends CircleProps {
    world: World;
    node: NodeData;
}

export class WorldNode extends Circle {
    world: WorldData;
    node: NodeData;


    constructor(props: WorldNodeProps) {
        super({ ...props, key: "NODE_" + props.node.id, lineWidth: 4, stroke: "white", fill: "black" });
        this.world = props.world.data;
        this.node = props.node;

        const color_node = <Shape scale={1.4}></Shape>;
        const sum = Array.from(this.node.ants.values()).map(v => v.qt).reduce((v1, v2) => v1 + v2, 0)

        Array.from(this.world.teams.entries()).forEach(([thisid, team], vi) => {
            const before = Array.from(this.world.teams.entries()).filter((v2, j) => j < vi).map(([name, color]) => this.node.ants.get(name)?.qt || 0).reduce((x, y) => x + y, 0)
            const group = this.node.ants.get(thisid);
            if (!group) return
            color_node.add(
                <Circle size={props.size} startAngle={360 * before / sum} endAngle={360 * (before + group.qt) / sum} fill={team.color} />
            )
            if (group.link) {
                const link_node = this.world.nodes.get(group.link);
                props.world.add(
                    <WordNodeBuilding world={props.world} team={group.team} points={[this.getAbsolutePosition(), props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />
                )
            }
        })

        this.add(color_node)
        this.add(<Circle {...props} position={[0, 0]} fill={"black"} stroke={"white"} lineWidth={4} />);

        const content_node = <Shape></Shape>;

        if (this.node.type === "WATER") {
            content_node.add(
                <Circle size={props.size} startAngle={0} endAngle={180} fill="#2bfafa" />
            )
            content_node.add(
                <Polygon sides={4} size={props.size} fill={"#2bfafa"} />
            )
            content_node.scale(0.5);
        } else if (this.node.type === "FOOD") {
            content_node.add(
                <Circle size={props.size} fill="red" />
            )
            content_node.scale(0.8 * props.node.food / this.world.maxfood);
        } else if (this.node.type === "QUEEN") {
            const teamdata = this.world.teams.get(this.node.team);

            for (let index = 0; index < 4; index++) {
                content_node.add(
                    <Circle size={props.size} startAngle={0} endAngle={60} rotation={index * 90} stroke={teamdata.color} lineWidth={10} />
                )
            }
            content_node.scale(0.5);
        }

        this.add(content_node)
    }
}

export interface WorldEdgeProps extends LineProps {
    world: World;
    edgeData: EdgeData;
}

export class WorldEdge extends Line {
    world: WorldData;
    edge: EdgeData;

    constructor(props: WorldEdgeProps) {
        super({
            ...props,
            points: [props.edgeData.id_1, props.edgeData.id_2].map(v => props.world.data.nodes.get(v)).map(v => new Vector2(v.x, v.y)).map(v => props.world.fromWorldToRect(v)),
            lineWidth: props.world.preferredNodeSize * 0.2,
            stroke: Color.lerp("black", "white", props.edgeData.life_ratio)
        });

        this.world = props.world.data;
        this.edge = props.edgeData;

        this.edge.groups.filter(v => v.qt > 0).forEach(group => {
            this.add(
                <Polygon sides={3 + Math.round(Math.log10(group.qt))} size={props.world.preferredNodeSize * 0.5 * Math.exp(-1 / group.qt)} position={this.getPointAtPercentage(group.progress).position} fill={this.world.teams.get(group.team).color} />
            )

            if (group.link) {
                const link_node = this.world.nodes.get(group.link);
                props.world.add(
                    <WordNodeBuilding world={props.world} team={group.team} points={[this.getPointAtPercentage(group.progress).position, props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />
                )
            }
        })
    }
}

export interface WorldNodeBuildingProps extends LineProps {
    world: World;
    team: number;
}

export class WordNodeBuilding extends Line {
    constructor(props: WorldNodeBuildingProps) {
        super({ ...props, stroke: props.world.data.teams.get(props.team).color, lineWidth: 4 });
    }
}