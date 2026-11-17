// Keyboard + mouse input, shared by the player ship and the menus.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    mouseMoved: false,
    pressed: new Set(), // keys pressed since last consume (edge-triggered)
  };

  const keyName = (event) => {
    const k = event.key;
    if (k === ' ') return 'Space';
    if (k.length === 1) return k.toLowerCase();
    return k;
  };

  window.addEventListener('keydown', (event) => {
    const name = keyName(event);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(name)) {
      event.preventDefault();
    }
    if (!event.repeat) {
      input.keys.add(name);
      input.pressed.add(name);
    }
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(keyName(event));
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouseDown = false;
  });

  const updateMouse = (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouseX = event.clientX - rect.left;
    input.mouseY = event.clientY - rect.top;
    input.mouseMoved = true;
  };
  canvas.addEventListener('mousemove', updateMouse);
  canvas.addEventListener('mousedown', (event) => {
    updateMouse(event);
    input.mouseDown = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });

  input.isDown = (name) => input.keys.has(name);
  input.wasPressed = (name) => input.pressed.has(name);
  input.consumePressed = () => input.pressed.clear();
  input.left = () => input.isDown('ArrowLeft') || input.isDown('a');
  input.right = () => input.isDown('ArrowRight') || input.isDown('d');
  input.up = () => input.isDown('ArrowUp') || input.isDown('w');
  input.down = () => input.isDown('ArrowDown') || input.isDown('s');
  input.firing = () => input.isDown('Space') || input.mouseDown;
  return input;
}
