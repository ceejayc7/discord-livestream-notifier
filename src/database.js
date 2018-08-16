import JsonDB from 'node-json-db';

const db = new JsonDB("slots_database", true, true);

function getData(key) {
    try {
        return db.getData(key);
    } catch(error) {
        return 0;
    }
}

function writeData(key, value) {
    try {
        return db.push(key, value);
    } catch(error) {
        return 0;
    }
}

function initializeUser(key) {
    // check to see if data exists before we initalize a new slots user
    if(Database.getData(key)) {
        return;
    }
    // Initialize keys since the user doesn't exist
    writeData(`${key}/x2`, getData(`${key}/x2`));
    writeData(`${key}/x3`, getData(`${key}/x3`));
    writeData(`${key}/x4`, getData(`${key}/x4`));
    writeData(`${key}/x5`, getData(`${key}/x5`));
    writeData(`${key}/money`, 1000);
}

export const Database = {
    getData,
    writeData,
    initializeUser
};
