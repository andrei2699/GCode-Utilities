import {
  G0G1Command,
  G2G3Command,
  type GCodeCommand,
  UnknownCommand,
} from '../commands/command.ts';

const ARC_LINEARIZATION_TOLERANCE = 0.1;
const PATH_COMMAND_PATTERN = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
const NUMBER_PATTERN = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

export function parsePathData(d: string): GCodeCommand[] {
  const commands: GCodeCommand[] = [];
  let currentX = 0;
  let currentY = 0;
  let subpathX = 0;
  let subpathY = 0;
  let previousCurveType = '';
  let cubicControlX = 0;
  let cubicControlY = 0;
  let quadraticControlX = 0;
  let quadraticControlY = 0;
  let match: RegExpExecArray | null;

  while ((match = PATH_COMMAND_PATTERN.exec(d)) !== null) {
    const commandType = match[1];
    const values = match[2].match(NUMBER_PATTERN)?.map(Number) ?? [];
    const isRelative = commandType === commandType.toLowerCase();

    switch (commandType.toLowerCase()) {
      case 'm':
      case 'l': {
        const isMove = commandType.toLowerCase() === 'm';
        let isFirstPoint = true;
        for (let index = 0; index + 1 < values.length; index += 2) {
          const x = isRelative ? currentX + values[index] : values[index];
          const y = isRelative ? currentY + values[index + 1] : values[index + 1];
          commands.push(
            new G0G1Command(x, y, undefined, undefined, undefined, isMove && isFirstPoint),
          );
          currentX = x;
          currentY = y;
          if (isMove && isFirstPoint) {
            subpathX = x;
            subpathY = y;
          }
          isFirstPoint = false;
        }
        previousCurveType = '';
        break;
      }
      case 'h':
        for (const value of values) {
          currentX = isRelative ? currentX + value : value;
          commands.push(new G0G1Command(currentX, undefined));
        }
        previousCurveType = '';
        break;
      case 'v':
        for (const value of values) {
          currentY = isRelative ? currentY + value : value;
          commands.push(new G0G1Command(undefined, currentY));
        }
        previousCurveType = '';
        break;
      case 'c':
      case 's':
      case 'q':
      case 't': {
        const commandTypeLower = commandType.toLowerCase();
        const parameterCount =
          commandTypeLower === 'c'
            ? 6
            : commandTypeLower === 's' || commandTypeLower === 'q'
              ? 4
              : 2;

        for (let index = 0; index + parameterCount - 1 < values.length; index += parameterCount) {
          let control1X = currentX;
          let control1Y = currentY;
          let control2X = currentX;
          let control2Y = currentY;
          let endX: number;
          let endY: number;

          if (commandTypeLower === 'c') {
            control1X = isRelative ? currentX + values[index] : values[index];
            control1Y = isRelative ? currentY + values[index + 1] : values[index + 1];
            control2X = isRelative ? currentX + values[index + 2] : values[index + 2];
            control2Y = isRelative ? currentY + values[index + 3] : values[index + 3];
            endX = isRelative ? currentX + values[index + 4] : values[index + 4];
            endY = isRelative ? currentY + values[index + 5] : values[index + 5];
          } else if (commandTypeLower === 's') {
            if (previousCurveType === 'c' || previousCurveType === 's') {
              control1X = 2 * currentX - cubicControlX;
              control1Y = 2 * currentY - cubicControlY;
            }
            control2X = isRelative ? currentX + values[index] : values[index];
            control2Y = isRelative ? currentY + values[index + 1] : values[index + 1];
            endX = isRelative ? currentX + values[index + 2] : values[index + 2];
            endY = isRelative ? currentY + values[index + 3] : values[index + 3];
          } else {
            let quadraticX: number;
            let quadraticY: number;
            if (commandTypeLower === 'q') {
              quadraticX = isRelative ? currentX + values[index] : values[index];
              quadraticY = isRelative ? currentY + values[index + 1] : values[index + 1];
              endX = isRelative ? currentX + values[index + 2] : values[index + 2];
              endY = isRelative ? currentY + values[index + 3] : values[index + 3];
            } else {
              quadraticX =
                previousCurveType === 'q' || previousCurveType === 't'
                  ? 2 * currentX - quadraticControlX
                  : currentX;
              quadraticY =
                previousCurveType === 'q' || previousCurveType === 't'
                  ? 2 * currentY - quadraticControlY
                  : currentY;
              endX = isRelative ? currentX + values[index] : values[index];
              endY = isRelative ? currentY + values[index + 1] : values[index + 1];
            }

            control1X = currentX + (2 / 3) * (quadraticX - currentX);
            control1Y = currentY + (2 / 3) * (quadraticY - currentY);
            control2X = endX + (2 / 3) * (quadraticX - endX);
            control2Y = endY + (2 / 3) * (quadraticY - endY);
            quadraticControlX = quadraticX;
            quadraticControlY = quadraticY;
          }

          commands.push(
            ...convertCubicCurve(
              currentX,
              currentY,
              control1X,
              control1Y,
              control2X,
              control2Y,
              endX,
              endY,
            ),
          );
          currentX = endX;
          currentY = endY;
          cubicControlX = control2X;
          cubicControlY = control2Y;
          previousCurveType = commandTypeLower;
        }
        break;
      }
      case 'a':
        for (let index = 0; index + 6 < values.length; index += 7) {
          const [radiusX, radiusY, rotation, largeArc, sweep, endXValue, endYValue] = values.slice(
            index,
            index + 7,
          );
          const endX = isRelative ? currentX + endXValue : endXValue;
          const endY = isRelative ? currentY + endYValue : endYValue;

          commands.push(
            ...convertArcToGCode(
              currentX,
              currentY,
              endX,
              endY,
              radiusX,
              radiusY,
              rotation,
              largeArc !== 0,
              sweep !== 0,
            ),
          );
          currentX = endX;
          currentY = endY;
        }
        previousCurveType = '';
        break;
      case 'z':
        currentX = subpathX;
        currentY = subpathY;
        commands.push(new G0G1Command(currentX, currentY));
        previousCurveType = '';
        break;
      default:
        commands.push(new UnknownCommand(`${commandType}${values.join(' ')}`));
        break;
    }
  }

  return commands;
}

function convertCubicCurve(
  startX: number,
  startY: number,
  control1X: number,
  control1Y: number,
  control2X: number,
  control2Y: number,
  endX: number,
  endY: number,
): GCodeCommand[] {
  const points: Array<{ x: number; y: number }> = [];
  flattenCubicCurve(
    { x: startX, y: startY },
    { x: control1X, y: control1Y },
    { x: control2X, y: control2Y },
    { x: endX, y: endY },
    points,
    0,
  );
  return points.map((point) => new G0G1Command(point.x, point.y));
}

function flattenCubicCurve(
  start: { x: number; y: number },
  control1: { x: number; y: number },
  control2: { x: number; y: number },
  end: { x: number; y: number },
  points: Array<{ x: number; y: number }>,
  depth: number,
): void {
  const flatness = Math.max(
    distanceFromLine(control1, start, end),
    distanceFromLine(control2, start, end),
  );

  if (flatness <= ARC_LINEARIZATION_TOLERANCE || depth >= 16) {
    points.push(end);
    return;
  }

  const startControl1 = midpoint(start, control1);
  const control1Control2 = midpoint(control1, control2);
  const control2End = midpoint(control2, end);
  const leftControl2 = midpoint(startControl1, control1Control2);
  const rightControl1 = midpoint(control1Control2, control2End);
  const splitPoint = midpoint(leftControl2, rightControl1);

  flattenCubicCurve(start, startControl1, leftControl2, splitPoint, points, depth + 1);
  flattenCubicCurve(splitPoint, rightControl1, control2End, end, points, depth + 1);
}

function midpoint(first: { x: number; y: number }, second: { x: number; y: number }) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function distanceFromLine(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);

  if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs(deltaY * point.x - deltaX * point.y + end.x * start.y - end.y * start.x) / length;
}

function convertArcToGCode(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  radiusX: number,
  radiusY: number,
  rotation: number,
  largeArc: boolean,
  sweep: boolean,
): GCodeCommand[] {
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);

  if ((startX === endX && startY === endY) || rx === 0 || ry === 0) {
    return startX === endX && startY === endY ? [] : [new G0G1Command(endX, endY)];
  }

  const phi = (rotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const halfDeltaX = (startX - endX) / 2;
  const halfDeltaY = (startY - endY) / 2;
  const transformedX = cosPhi * halfDeltaX + sinPhi * halfDeltaY;
  const transformedY = -sinPhi * halfDeltaX + cosPhi * halfDeltaY;
  const radiiScale =
    (transformedX * transformedX) / (rx * rx) + (transformedY * transformedY) / (ry * ry);

  if (radiiScale > 1) {
    const scale = Math.sqrt(radiiScale);
    rx *= scale;
    ry *= scale;
  }

  const numerator = Math.max(
    0,
    rx * rx * ry * ry -
      rx * rx * transformedY * transformedY -
      ry * ry * transformedX * transformedX,
  );
  const denominator = rx * rx * transformedY * transformedY + ry * ry * transformedX * transformedX;
  const centerFactor =
    (largeArc === sweep ? -1 : 1) * Math.sqrt(denominator === 0 ? 0 : numerator / denominator);
  const centerTransformedX = (centerFactor * rx * transformedY) / ry;
  const centerTransformedY = (-centerFactor * ry * transformedX) / rx;
  const centerX = cosPhi * centerTransformedX - sinPhi * centerTransformedY + (startX + endX) / 2;
  const centerY = sinPhi * centerTransformedX + cosPhi * centerTransformedY + (startY + endY) / 2;
  const startVectorX = (transformedX - centerTransformedX) / rx;
  const startVectorY = (transformedY - centerTransformedY) / ry;
  const endVectorX = (-transformedX - centerTransformedX) / rx;
  const endVectorY = (-transformedY - centerTransformedY) / ry;
  const startAngle = Math.atan2(startVectorY, startVectorX);
  let deltaAngle = Math.atan2(
    startVectorX * endVectorY - startVectorY * endVectorX,
    startVectorX * endVectorX + startVectorY * endVectorY,
  );

  if (!sweep && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  if (sweep && deltaAngle < 0) deltaAngle += 2 * Math.PI;

  if (Math.abs(rx - ry) <= Number.EPSILON * Math.max(rx, ry) * 16) {
    return [new G2G3Command(sweep, endX, endY, undefined, centerX - startX, centerY - startY)];
  }

  return linearizeEllipseArc(
    centerX,
    centerY,
    rx,
    ry,
    cosPhi,
    sinPhi,
    startAngle,
    deltaAngle,
    endX,
    endY,
  );
}

function linearizeEllipseArc(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  cosPhi: number,
  sinPhi: number,
  startAngle: number,
  deltaAngle: number,
  endX: number,
  endY: number,
): GCodeCommand[] {
  const maxRadius = Math.max(radiusX, radiusY);
  const maxSegmentAngle = 2 * Math.acos(Math.max(-1, 1 - ARC_LINEARIZATION_TOLERANCE / maxRadius));
  const segmentCount = Math.max(1, Math.ceil(Math.abs(deltaAngle) / maxSegmentAngle));
  const commands: GCodeCommand[] = [];

  for (let index = 1; index <= segmentCount; index += 1) {
    if (index === segmentCount) {
      commands.push(new G0G1Command(endX, endY));
      continue;
    }

    const angle = startAngle + (deltaAngle * index) / segmentCount;
    const ellipseX = radiusX * Math.cos(angle);
    const ellipseY = radiusY * Math.sin(angle);
    const x = centerX + cosPhi * ellipseX - sinPhi * ellipseY;
    const y = centerY + sinPhi * ellipseX + cosPhi * ellipseY;
    commands.push(new G0G1Command(x, y));
  }

  return commands;
}
