import { Line, LineProps, Polygon } from "@motion-canvas/2d";
import { Color, createSignal, easeInExpo, easeOutExpo, Vector2 } from "@motion-canvas/core";
import { EdgeData, WorldData } from "./DataType";
import { World } from "./World";
import { WordNodeBuilding } from "./WordNodeBuilding";


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

            const progress = createSignal(group.progress);

            const group_node = <Polygon sides={3 + Math.round(Math.log10(group.qt))} size={props.world.preferredNodeSize * 0.5 * Math.exp(-1 / group.qt)} position={() => this.getPointAtPercentage(progress()).position} fill={this.world.teams.get(group.team).color} />

            this.add(group_node);

            if (group.link) {
                group.link.map(v => this.world.nodes.get(v))
                    .forEach(link_node => {
                        props.world.add(
                            <WordNodeBuilding world={props.world} team={group.team} points={() => [group_node.position, props.world.fromWorldToRect(new Vector2(link_node.x, link_node.y))]} lineDash={[20, 10]} />
                        )
                    })
            }

            if (group.anim) {
                if (group.anim.progress === 0 || group.anim.progress === 1) {
                    props.world.generators.push(t => progress(group?.anim?.progress, t));
                    props.world.generators.push(t => group_node.opacity(0, t, easeInExpo));
                } else {
                    props.world.generators.push(t => progress(group?.anim?.progress, t));

                }
            }
        })
    }
}
