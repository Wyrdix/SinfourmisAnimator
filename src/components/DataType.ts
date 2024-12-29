export interface RawWorldData {
    teams: TeamData[]
    nodes: RawNodeData[],
    edges: RawEdgeData[],
    maxfood: number
}

export interface TeamData {
    id: number,
    name: string,
    color: string,
    score: number
}

export interface NodeDataAnimation {
    food?: number;
}

export interface RawNodeData {
    type?: "EMPTY" | "FOOD" | "WATER" | "QUEEN";
    food?: number,
    team?: number,
    id: number,
    x: number,
    y: number,
    ants?: AntGroupData[];

    anim?: NodeDataAnimation;
}

export interface AntGroupData {
    team: number,
    qt: number,
    link?: number
}

export interface AntGroupEdgeAnimationData {
    progress: number;
}

export interface RawEdgeData {
    ids: [number, number],
    life_ratio?: number,
    groups?: ({ progress: number, anim?: AntGroupEdgeAnimationData } & AntGroupData)[]
}

export class WorldData {
    teams: Map<number, TeamData> = new Map();
    nodes: Map<number, NodeData> = new Map();
    maxfood: number
    private edges: Map<number, Map<number, EdgeData>> = new Map();

    constructor(raw: RawWorldData) {
        this.maxfood = raw.maxfood;
        raw.nodes.map(v => new NodeData(v)).forEach(v => {
            this.nodes.set(v.id, v);
        });
        raw.edges.map(v => new EdgeData(v)).map(v => {

            let current = this.edges.get(
                v.id_1
            ) || new Map();

            current.set(v.id_2, v);
            this.edges.set(v.id_1, current);
        }
        )

        raw.teams.forEach(team => {
            this.teams.set(team.id, team);
        })
    }

    get_edges(): EdgeData[] {
        return Array.from(this.edges.values()).map(v => Array.from(v.values())).reduce((v1, v2) => v1.concat(v2), []).sort((v1, v2) => v1.life_ratio - v2.life_ratio)
    }


}

export class NodeData {
    id: number;
    x: number;
    y: number;
    type: "EMPTY" | "WATER" | "FOOD" | "QUEEN";
    food: number;
    team: number;
    ants: Map<number, AntGroupData> = new Map();
    anim?: NodeDataAnimation;


    constructor(raw: RawNodeData) {
        this.id = raw.id;
        this.x = raw.x;
        this.y = raw.y;
        this.type = raw.type || "EMPTY";
        this.team = raw.type === "QUEEN" ? raw.team || 0 : 0;
        this.food = raw.type === "FOOD" ? raw.food || 0 : 0;
        raw.ants?.forEach(v => this.ants.set(v.team, v));
        this.anim = raw.anim;
    }
}

export class EdgeData {
    id_1: number;
    id_2: number;
    life_ratio: number;
    groups: ({ progress: number, anim?: AntGroupEdgeAnimationData } & AntGroupData)[];

    constructor(raw: RawEdgeData) {
        [this.id_1, this.id_2] = raw.ids.sort((a, b) => a - b);
        this.life_ratio = raw.life_ratio || 0;
        this.groups = raw.groups || [];
    }
}