import { Circle, Shape, Polygon, CircleProps } from "@motion-canvas/2d";
import { all, createRef, createSignal, SimpleSignal, useLogger, Vector2 } from "@motion-canvas/core";
import { WorldData, NodeData } from "./DataType";
import { World } from "./World";
import { WordNodeBuilding } from "./WordNodeBuilding";
import { beforeEach } from "vitest";


export class WorldNode extends Circle {
    world: WorldData;
    node: NodeData;


    constructor(props: WorldNodeProps) {
        super({ ...props, key: "NODE_" + props.node.id, lineWidth: 4, stroke: "white", fill: props.world.colorizer(props.node.phero) });
        useLogger().info(JSON.stringify(this.fill()));
        this.world = props.world.data;
        this.node = props.node;

        const numberOfTeams = this.world.teams.size;

        const color_node = <Shape scale={1.4}></Shape>;

        const before_value = Array.from(this.node.ants.values());
        const before_value_map = this.node.ants;
        const after_value = this.node?.anim?.ants?.values() == null ? before_value : Array.from(this.node?.anim?.ants?.values());
        const after_value_map = this.node?.anim?.ants?.values() == null ? before_value_map : this.node.anim.ants;

        let before_sum = before_value.map(v => v.qt).reduce((v1, v2) => v1 + v2, 0);
        let safe_before = Math.max(before_sum, 1)
        let after_sum = after_value.map(v => v.qt).reduce((v1, v2) => v1 + v2, 0);
        let safe_after = Math.max(after_sum, 1)

        const sig = createSignal(1);

        let separator: SimpleSignal<number, void>[] = [];
        let next_separators_value: number[] = [];

        separator.push(createSignal(0));
        next_separators_value.push(0);

        for (let index = 0; index < numberOfTeams; index++) {
            separator.push(createSignal(
                Array.from(this.world.teams.entries())
                    .filter((v2, j) => j < index)
                    .map(v => before_value_map.get(v[1].id)?.qt || 0)
                    .reduce((x, y) => x + y, 0) / safe_before));

            next_separators_value.push(
                Array.from(this.world.teams.entries())
                    .filter((v2, j) => j < index)
                    .map(v => after_value_map.get(v[1].id)?.qt || 0)
                    .reduce((x, y) => x + y, 0) / safe_after
            )
        }

        separator.push(createSignal(before_sum ? 1 : 0));
        next_separators_value.push(after_sum ? 1 : 0);

        Array.from(this.world.teams.entries()).forEach(([thisid, team], vi) => {
            let vj = vi + 1;
            const group = before_value_map.get(thisid) || { qt: 0, team: team.id };
            const after_group = after_value_map.get(thisid) || { qt: 0, team: team.id };
            color_node.add(
                <Circle size={props.size}
                    opacity={() => {
                        const delta = (separator[vj + 1]() - separator[vj]())
                        return delta <= 0.01 ? 0 : sig();
                    }}
                    startAngle={() => {
                        return separator[vj]() * 360;
                    }}
                    endAngle={() => separator[vj + 1]() * 360}
                    stroke={team.color} lineWidth={10} />
            );
            if (group.link) {
                group.link
                    .forEach(v => {
                        const link_node = this.world.nodes.get(v)
                        const node = createRef<WordNodeBuilding>();
                        props.world.add(<WordNodeBuilding ref={node} world={props.world} team={group.team} points={[this.getAbsolutePosition(), props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />
                        );

                        if (!after_value_map.get(thisid)?.link?.includes(v))
                            props.world.generators.push({ generator: t => node().start(1, t), type: "ON_NODE_LINK" })
                    })
            }

            if (after_group.link) {
                after_group.link
                    .forEach(v => {
                        if (!before_value_map.get(thisid)?.link?.includes(v)) {
                            const link_node = this.world.nodes.get(v)
                            const node = createRef<WordNodeBuilding>();
                            props.world.add(<WordNodeBuilding ref={node} end={0} world={props.world} team={group.team} points={[this.getAbsolutePosition(), props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />);

                            props.world.generators.push({ generator: t => node().end(1, t), type: "ON_NODE_UNLINK" })
                        }
                    })
            }
        });
        if (next_separators_value[0] == 1) {
            next_separators_value[0] = 0;
            next_separators_value[1] = 1;
        }

        props.world.generators.push({
            generator: (t) => {
                return all(
                    ...separator.map((v, i) => v(next_separators_value[i], t))
                )
            }, type: "NODE_UPDATE"
        });


        this.add(color_node);

        const content_node = <Shape></Shape>;

        if (this.node.type === "EAU") {
            content_node.add(
                <Circle size={props.size} startAngle={0} endAngle={180} fill="#2bfafa" />
            );
            content_node.add(
                <Polygon sides={4} size={props.size} fill={"#2bfafa"} />
            );
            content_node.scale(0.5);
        } else if (this.node.type === "NOURRITURE") {
            content_node.add(
                <Circle size={props.size} fill="red" />
            );
            const scale_signal = createSignal(props.node.food);
            content_node.scale(() => 0.8 * scale_signal() / this.world.max_food);

            if (this.node?.anim?.food)
                props.world.generators.push({
                    generator: t =>
                        scale_signal(this.node.anim.food, t)
                    , type: "FOOD_UPDATE"
                })
        } else if (this.node.type === "REINE") {
            const teamdata = this.world.teams.get(this.node.team);

            for (let index = 0; index < 4; index++) {
                content_node.add(
                    <Circle size={props.size} startAngle={0} endAngle={60} rotation={index * 90} stroke={teamdata?.color || "white"} lineWidth={10} />
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

