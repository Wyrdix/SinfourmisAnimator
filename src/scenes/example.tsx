import { makeScene2D, word } from '@motion-canvas/2d';
import * as raw_world from "../../data/world.json"
import { all, createRef, Reference, Vector2, waitFor } from '@motion-canvas/core';
import { World as W_Component } from '../components/World';
import { RawWorldData, WorldData } from '../components/DataType';

export default makeScene2D(function* (view) {

    const world_data = new WorldData(raw_world as any as RawWorldData)

    const world: Reference<W_Component> = createRef();

    view.add(
        <W_Component ref={world} data={world_data} fixed_size={new Vector2(view.width(), view.height())} />
    )
    yield* waitFor(0.5);

    yield* all(...world().generators.map(v => v(1)))
});
