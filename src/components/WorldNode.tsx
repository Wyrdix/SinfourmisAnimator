import { Circle, Shape, Polygon, CircleProps } from "@motion-canvas/2d";
import { all, createSignal, SimpleSignal, unwrap, useLogger, Vector2 } from "@motion-canvas/core";
import { WorldData, NodeData, AntGroupData } from "./DataType";
import { World } from "./World";
import { WordNodeBuilding } from "./WordNodeBuilding";
import { sep } from "path";


export class WorldNode extends Circle {
    world: WorldData;
    node: NodeData;


    constructor(props: WorldNodeProps) {
        super({ ...props, key: "NODE_" + props.node.id, lineWidth: 4, stroke: "white", fill: "black" });
        this.world = props.world.data;
        this.node = props.node;

        const numberOfTeams = this.world.teams.size;

        const color_node = <Shape scale={1.4}></Shape>;

        const before_value = Array.from(this.node.ants.values());
        const after_value = this.node?.anim?.ants?.values() == null ? before_value : Array.from(this.node?.anim?.ants?.values());

        const before_sum = before_value.map(v => v.qt).reduce((v1, v2) => v1 + v2, 0);
        const after_sum = after_value.map(v => v.qt).reduce((v1, v2) => v1 + v2, 0);

        const sig = createSignal(0);

        let separator: SimpleSignal<number, void>[] = [];
        let next_separators_value: number[] = [];

        for (let index = 0; index < numberOfTeams; index++) {
            separator.push(createSignal(
                Array.from(this.world.teams.entries())
                    .filter((v2, j) => j < index)
                    .map(v => before_value.filter(v2 => v2.team == v[1].id).map(v => v.qt).reduce((x, y) => x + y, 0))
                    .reduce((x, y) => x + y, 0) / before_sum || 0));

            next_separators_value.push(
                Array.from(this.world.teams.entries())
                    .filter((v2, j) => j < index)
                    .map(v => after_value.filter(v2 => v2.team == v[1].id).map(v => v.qt).reduce((x, y) => x + y, 0))
                    .reduce((x, y) => x + y, 0) / after_sum || 0
            )
        }

        Array.from(this.world.teams.entries()).forEach(([thisid, team], vi) => {
            const group = this.node.ants.get(thisid) || { qt: 0, team: team.id };
            color_node.add(
                <Circle size={props.size}
                    opacity={() => {
                        return (Math.abs(separator[(vi + numberOfTeams - 1) % numberOfTeams]() - separator[(vi + numberOfTeams) % numberOfTeams]()) * 360) % 360 <= 4 ? 0 : 1;
                    }}
                    startAngle={() => separator[(vi + numberOfTeams - 1) % numberOfTeams]() * 360 + 2}
                    endAngle={() => separator[(vi + numberOfTeams) % numberOfTeams]() * 360 - 2}
                    stroke={team.color} lineWidth={10} />
            );
            if (group.link) {
                group.link.map(v => this.world.nodes.get(v))
                    .forEach(link_node => {
                        props.world.add(
                            <WordNodeBuilding world={props.world} team={group.team} points={[this.getAbsolutePosition(), props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />
                        );
                    })
            }
        });

        props.world.generators.push((t) => {
            return all(
                ...separator.map((v, i) => v(next_separators_value[i], t))
            )
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
            const scale_signal = createSignal(props.node.food);
            content_node.scale(() => 0.8 * scale_signal() / this.world.maxfood);

            if (this.node?.anim?.food)
                props.world.generators.push(t =>
                    scale_signal(this.node.anim.food, t)
                )
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

