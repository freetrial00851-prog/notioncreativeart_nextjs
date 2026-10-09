import fs from 'fs'

/** Official Google Material Symbols Outlined shopping_bag FILL=1 24px (960-unit path). */
const SOURCE =
  'M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm160-640h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720Zm200 200q17 0 28.5-11.5T640-560v-80h-80v80q0 17 11.5 28.5T600-520Zm-240 0q17 0 28.5-11.5T400-560v-80h-80v80q0 17 11.5 28.5T360-520Z'

function mapX(n) {
  return Number((n / 40).toFixed(3))
}
function mapY(n) {
  return Number(((n + 960) / 40).toFixed(3))
}
function fmt(n) {
  return String(n)
}

const tokens = []
const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g
let m
while ((m = re.exec(SOURCE))) {
  if (m[1]) tokens.push({ type: 'cmd', v: m[1] })
  else tokens.push({ type: 'num', v: parseFloat(m[2]) })
}

let i = 0
let cmd = null
let abs = true
let cx = 0
let cy = 0
let startX = 0
let startY = 0
let out = ''

function take() {
  return tokens[i++].v
}

while (i < tokens.length) {
  if (tokens[i].type === 'cmd') {
    cmd = take()
    abs = cmd === cmd.toUpperCase()
  }
  const c = cmd.toUpperCase()

  if (c === 'Z') {
    out += 'Z'
    cx = startX
    cy = startY
    continue
  }

  if (c === 'M') {
    let first = true
    while (i < tokens.length && tokens[i].type === 'num') {
      let x = take()
      let y = take()
      if (!abs) {
        x += cx
        y += cy
      }
      cx = x
      cy = y
      if (first) {
        startX = cx
        startY = cy
        out += 'M' + fmt(mapX(x)) + ' ' + fmt(mapY(y)) + ' '
        first = false
      } else {
        out += 'L' + fmt(mapX(x)) + ' ' + fmt(mapY(y)) + ' '
      }
    }
  } else if (c === 'L' || c === 'T') {
    while (i < tokens.length && tokens[i].type === 'num') {
      let x = take()
      let y = take()
      if (!abs) {
        x += cx
        y += cy
      }
      cx = x
      cy = y
      out += c + fmt(mapX(x)) + ' ' + fmt(mapY(y)) + ' '
    }
  } else if (c === 'H') {
    while (i < tokens.length && tokens[i].type === 'num') {
      let x = take()
      if (!abs) x += cx
      cx = x
      out += 'H' + fmt(mapX(x)) + ' '
    }
  } else if (c === 'V') {
    while (i < tokens.length && tokens[i].type === 'num') {
      let y = take()
      if (!abs) y += cy
      cy = y
      out += 'V' + fmt(mapY(y)) + ' '
    }
  } else if (c === 'Q') {
    while (i < tokens.length && tokens[i].type === 'num') {
      let x1 = take()
      let y1 = take()
      let x = take()
      let y = take()
      if (!abs) {
        x1 += cx
        y1 += cy
        x += cx
        y += cy
      }
      cx = x
      cy = y
      out +=
        'Q' +
        fmt(mapX(x1)) +
        ' ' +
        fmt(mapY(y1)) +
        ' ' +
        fmt(mapX(x)) +
        ' ' +
        fmt(mapY(y)) +
        ' '
    }
  } else if (c === 'S') {
    while (i < tokens.length && tokens[i].type === 'num') {
      let x2 = take()
      let y2 = take()
      let x = take()
      let y = take()
      if (!abs) {
        x2 += cx
        y2 += cy
        x += cx
        y += cy
      }
      cx = x
      cy = y
      out +=
        'S' +
        fmt(mapX(x2)) +
        ' ' +
        fmt(mapY(y2)) +
        ' ' +
        fmt(mapX(x)) +
        ' ' +
        fmt(mapY(y)) +
        ' '
    }
  } else {
    throw new Error('Unhandled ' + cmd)
  }
}

const result = out.trim().replace(/ +/g, ' ')
console.log(result)
fs.writeFileSync('exports/shopping-bag-fill1-24.txt', result + '\n')
