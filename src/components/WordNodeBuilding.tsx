import { Line, LineProps } from "@motion-canvas/2d";
import { World } from "./World";
export interface WorldNodeBuildingProps extends LineProps {
    world: World;
    team: number;
}

export class WordNodeBuilding extends Line {
    constructor(props: WorldNodeBuildingProps) {
        super({ ...props, stroke: props.world.data.teams.get(props.team).color, lineWidth: 4 });
    }
}
