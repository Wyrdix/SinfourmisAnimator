import { Circle, Shape, Polygon, CircleProps } from "@motion-canvas/2d";
import { Vector2 } from "@motion-canvas/core";
import { WorldData, NodeData } from "./DataType";
import { World } from "./World";
import { WordNodeBuilding } from "./WordNodeBuilding";


export class WorldNode extends Circle {
    world: WorldData;
    node: NodeData;


    constructor(props: WorldNodeProps) {
        super({ ...props, key: "NODE_" + props.node.id, lineWidth: 4, stroke: "white", fill: "black" });
        this.world = props.world.data;
        this.node = props.node;

        const color_node = <Shape scale={1.4}></Shape>;
        const sum = Array.from(this.node.ants.values()).map(v => v.qt).reduce((v1, v2) => v1 + v2, 0);

        Array.from(this.world.teams.entries()).forEach(([thisid, team], vi) => {
            const before = Array.from(this.world.teams.entries()).filter((v2, j) => j < vi).map(([name, color]) => this.node.ants.get(name)?.qt || 0).reduce((x, y) => x + y, 0);
            const group = this.node.ants.get(thisid);
            if (!group) return;
            color_node.add(
                <Circle size={props.size} startAngle={360 * before / sum} endAngle={360 * (before + group.qt) / sum} fill={team.color} />
            );
            if (group.link) {
                const link_node = this.world.nodes.get(group.link);
                props.world.add(
                    <WordNodeBuilding world={props.world} team={group.team} points={[this.getAbsolutePosition(), props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />
                );
            }
        });

        this.add(color_node);
        this.add(<Circle {...props} position={[0, 0]} fill={"black"} stroke={"white"} lineWidth={4} />);

        const content_node = <Shape></Shape>;

        if (this.node.type === "WATER") {
            content_node.add(
                <Circle size={props.size} startAngle={0} endAngle={180} fill="#2bfafa" />
            );
            content_node.add(
                <Polygon sides={4} size={props.size} fill={"#2bfafa"} />
            );
            content_node.scale(0.5);
        } else if (this.node.type === "FOOD") {
            content_node.add(
                <Circle size={props.size} fill="red" />
            );
            content_node.scale(0.8 * props.node.food / this.world.maxfood);
        } else if (this.node.type === "QUEEN") {
            const teamdata = this.world.teams.get(this.node.team);

            for (let index = 0; index < 4; index++) {
                content_node.add(
                    <Circle size={props.size} startAngle={0} endAngle={60} rotation={index * 90} stroke={teamdata.color} lineWidth={10} />
                );
            }
            content_node.scale(0.5);
        }

        this.add(content_node);
    }
}
export interface WorldNodeProps extends CircleProps {
    world: World;
    node: NodeData;
}

