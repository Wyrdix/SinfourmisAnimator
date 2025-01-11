import { clamp, useLogger } from "@motion-canvas/core";

export interface EnvConfig {
    colorizer?: "8Bit" | "File";
    render_start?: number;
    render_end?: number;
    time_per_step?: number;
    hud?: boolean;
}

export interface RawWorldData {
    teams: TeamData[]
    nodes: RawNodeData[],
    edges: RawEdgeData[],
    max_food: number
}

export interface TeamData {
    id: number,
    name: string,
    color: string,
    score: number,
    next?: TeamDataAnimation

}

export interface TeamDataAnimation {
    score: number
}

export interface RawNodeDataAnimation {
    food?: number;
    ants?: AntGroupData[];
}

export interface RawNodeData {
    type?: "VIDE" | "NOURRITURE" | "EAU" | "REINE";
    food?: number,
    team?: number,
    id: number,
    x: number,
    y: number,
    pheromone: number,
    ants?: AntGroupData[];

    anim?: RawNodeDataAnimation;
}

export interface AntGroupData {
    team: number,
    qt: number,
    link?: number[]
}

export interface AntGroupEdgeAnimationData {
    progress: number;
}

export interface NodeDataAnimation {
    food?: number;
    ants?: Map<number, AntGroupData>;
}

export interface RawEdgeData {
    id_1: number,
    id_2: number,
    life_ratio?: number,
    groups?: ({ progress: number, anim?: AntGroupEdgeAnimationData } & AntGroupData)[]
}

export class WorldData {
    teams: Map<number, TeamData> = new Map();
    nodes: Map<number, NodeData> = new Map();
    max_food: number
    private edges: EdgeData[];

    constructor(raw: RawWorldData) {
        this.max_food = raw.max_food;
        raw.nodes.map(v => new NodeData(v)).forEach(v => {
            this.nodes.set(v.id, v);
        });
        this.edges = raw.edges.map(v => new EdgeData(v))

        raw.teams.forEach(team => {
            this.teams.set(team.id, team);
        })
    }

    get_edges(): EdgeData[] {
        return this.edges;
    }


}

export class NodeData {
    id: number;
    x: number;
    y: number;
    type: "VIDE" | "EAU" | "NOURRITURE" | "REINE";
    food: number;
    team: number;
    ants: Map<number, AntGroupData> = new Map();
    anim?: NodeDataAnimation;
    phero: number;


    constructor(raw: RawNodeData) {
        this.id = raw.id;
        this.x = raw.x;
        this.y = raw.y;
        this.phero = raw.pheromone;
        if (this.id === 4) this.y *= -2;
        this.type = raw.type || "VIDE";
        this.team = raw.type === "REINE" ? raw.team || 0 : 0;
        this.food = raw.type === "NOURRITURE" ? raw.food || 0 : 0;
        raw.ants?.forEach(v => this.ants.set(v.team, v));
        this.anim = {
            food: raw?.anim?.food,
            ants: raw?.anim?.ants ? new Map(raw?.anim?.ants?.map(v => [v.team, v])) : undefined
        }
    }
}

export class EdgeData {
    id_1: number;
    id_2: number;
    life_ratio: number;
    groups: ({ progress: number, anim?: AntGroupEdgeAnimationData } & AntGroupData)[];

    constructor(raw: RawEdgeData) {
        this.id_1 = raw.id_1;
        this.id_2 = raw.id_2;
        this.life_ratio = raw.life_ratio || 0;
        this.groups = raw.groups || [];
        this.groups.forEach(v => { if (v.anim) v.anim.progress = clamp(0, 1, v.anim.progress) })
    }
}