import JsonDB from 'node-json-db';
import { PLAYERS } from '@root/constants';

const db = new JsonDB('slots_database', true, true);

const getData = (key) => {
  try {
    return db.getData(key);
  } catch (error) {
    return 0;
  }
};

const writeData = (key, value) => {
  try {
    return db.push(key, value);
  } catch (error) {
    return 0;
  }
};

const initializeUser = (server, user) => {
  // check to see if data exists before we initalize a new slots user
  const key = `/${server}/${PLAYERS}/${user}`;
  if (Database.getData(key)) {
    return;
  }
  // Initialize keys since the user doesn't exist
  writeData(`${key}/x2`, 0);
  writeData(`${key}/x3`, 0);
  writeData(`${key}/x4`, 0);
  writeData(`${key}/x5`, 0);
  writeData(`${key}/money`, 1000);
  writeData(`${key}/total`, 0);
  writeData(`${key}/name`, user);
  writeData(`${key}/maxWeightFish`, 0);
};

export const Database = {
  getData,
  writeData,
  initializeUser
};
