import { h } from 'preact';
import htm from 'htm';

export const html = htm.bind(h);
export { render } from 'preact';
export { useState, useEffect, useRef, useReducer } from 'preact/hooks';
