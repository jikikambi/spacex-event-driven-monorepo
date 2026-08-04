import launches from '../mock-data/launches.json';
import rockets from '../mock-data/rockets.json';
import payloads from '../mock-data/payloads.json';
import ships from '../mock-data/ships.json';
import launchpads from '../mock-data/launchpads.json';

import { Launch } from 'spacex-types';

export const mockLaunches = launches as Launch[];

export function getLaunchFixture() {

    const launch = mockLaunches.find(l =>

        !!l.id &&

        rockets.some(r => r.id === l.rocket) &&

        payloads.some(p => l.payloads.includes(p.id)) &&

        ships.some(s => l.ships.includes(s.id)) &&

        launchpads.some(lp => lp.id === l.launchpad)
    );

    if (!launch?.id) {

        throw new Error('Launch fixture is missing id');
        
    }

    return {

        launch,

        rocket: rockets.find(r => r.id === launch.rocket)!,

        payloads: payloads.filter(p => launch.payloads.includes(p.id)),

        ships: ships.filter(s => launch.ships.includes(s.id)),

        launchpad: launchpads.find(lp => lp.id === launch.launchpad)!

    };
}