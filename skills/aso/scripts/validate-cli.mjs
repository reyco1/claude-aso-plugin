#!/usr/bin/env node
// Usage: node validate-cli.mjs '{"name":"Habit Tracker - HabitKit","subtitle":"...","keywords":"a,b,c","primaryKeyword":"habit tracker"}'
import { validateMetadata } from "./validate.mjs";
const result = validateMetadata(JSON.parse(process.argv[2] || "{}"));
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
