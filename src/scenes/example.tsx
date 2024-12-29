import { makeScene2D } from '@motion-canvas/2d';
import * as raw_world from "../../data/world.json"
import { Vector2, waitFor } from '@motion-canvas/core';
import { World as W_Component } from '../components/World';
import { RawWorldData, WorldData } from '../components/DataType';

export default makeScene2D(function* (view) {

    const world = new WorldData(raw_world as RawWorldData)

    view.add(
        <W_Component data={world} fixed_size={new Vector2(view.width(), view.height())} />
    )
    yield* waitFor(4);
});
