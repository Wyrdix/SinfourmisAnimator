import { makeScene2D, PossibleCanvasStyle, Txt, word } from '@motion-canvas/2d';
import * as raw_steps from "../../data/world.json"
import { all, beginSlide, Color, createRef, Reference, SignalValue, useLogger, Vector2, waitFor } from '@motion-canvas/core';
import { World as W_Component } from '../components/World';
import { RawWorldData, WorldData } from '../components/DataType';
import colorize_file from "../colorize.json"

interface EnvConfig {
    colorizer?: "8Bit" | "File";
    render_start?: number;
    render_end?: number;
}


export default makeScene2D(function* (view) {

    const config: EnvConfig = JSON.parse(import.meta.env.VITE_ANIMCONFIG || "{}")

    let parsed_steps: any[] = []

    let colorize: (v: number) => PossibleCanvasStyle = () => "black";

    if (config.colorizer === "File") {
        const map = new Map(Object.entries(colorize_file.colors))
        colorize = (v: number) => (map.get(v.toString()) as (PossibleCanvasStyle | undefined)) || "black"
    }
    if (config.colorizer === "8Bit") {
        colorize = (v: number) => {
            let r = (v >> 5) * 255 / 7
            let g = ((v >> 2) & 0x07) * 255 / 7
            let b = (v & 0x03) * 255 / 3
            return {
                r, g, b, a: 1
            } as PossibleCanvasStyle;
        }
    }

    parsed_steps = Array.from(new Map(Object.entries(raw_steps.data)).entries()).sort(([k1, v1], [k2, v2]) => Number.parseInt(k1) - Number.parseInt(k2)).map(([_k, v]) => v);

    for (let i = config.render_start || 0; i < Math.min(parsed_steps.length, config.render_end || Number.MAX_VALUE); i++) {
        yield* beginSlide("Step " + (i + 1))
        view.children().forEach(v => v.remove().dispose());
        const element = parsed_steps[i];
        const world_data = new WorldData(element as any as RawWorldData)

        const world: Reference<W_Component> = createRef();
        view.add(
            <W_Component ref={world} data={world_data} colorizer={colorize} fixed_size={new Vector2(view.width(), view.height())} />
        )
        yield* all(...world().generators.map(v => v.generator(1)))
    }

});
