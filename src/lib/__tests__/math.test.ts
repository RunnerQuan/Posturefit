import { describe, it, expect } from 'vitest';
import { calculateAngle, calculateDistance, midpoint } from '../math';

describe('calculateAngle', () => {
  it('should return 90 degrees for a right angle', () => {
    const pointA = { x: 0, y: 1 };
    const pointB = { x: 0, y: 0 };
    const pointC = { x: 1, y: 0 };
    
    const angle = calculateAngle(pointA, pointB, pointC);
    
    expect(angle).toBeCloseTo(90, 1);
  });

  it('should return 0 degrees for same points', () => {
    const pointA = { x: 0, y: 0 };
    const pointB = { x: 0, y: 0 };
    const pointC = { x: 1, y: 0 };
    
    const angle = calculateAngle(pointA, pointB, pointC);
    
    expect(angle).toBeCloseTo(0, 1);
  });

  it('should handle vertical lines correctly', () => {
    const pointA = { x: 0, y: 2 };
    const pointB = { x: 0, y: 0 };
    const pointC = { x: 0, y: -1 };
    
    const angle = calculateAngle(pointA, pointB, pointC);
    
    expect(angle).toBeCloseTo(180, 1);
  });

  it('should handle 45 degree angle', () => {
    const pointA = { x: 1, y: 1 };
    const pointB = { x: 0, y: 0 };
    const pointC = { x: 1, y: 0 };
    
    const angle = calculateAngle(pointA, pointB, pointC);
    
    expect(angle).toBeCloseTo(45, 1);
  });
});

describe('calculateDistance', () => {
  it('should return correct distance between two points', () => {
    const pointA = { x: 0, y: 0 };
    const pointB = { x: 3, y: 4 };
    
    const distance = calculateDistance(pointA, pointB);
    
    expect(distance).toBeCloseTo(5, 1);
  });

  it('should return 0 for same points', () => {
    const pointA = { x: 5, y: 5 };
    const pointB = { x: 5, y: 5 };
    
    const distance = calculateDistance(pointA, pointB);
    
    expect(distance).toBe(0);
  });

  it('should handle horizontal distance', () => {
    const pointA = { x: 0, y: 0 };
    const pointB = { x: 10, y: 0 };
    
    const distance = calculateDistance(pointA, pointB);
    
    expect(distance).toBe(10);
  });

  it('should handle vertical distance', () => {
    const pointA = { x: 0, y: 0 };
    const pointB = { x: 0, y: 7 };
    
    const distance = calculateDistance(pointA, pointB);
    
    expect(distance).toBe(7);
  });
});

describe('midpoint', () => {
  it('should return correct midpoint', () => {
    const pointA = { x: 0, y: 0 };
    const pointB = { x: 4, y: 6 };
    
    const mid = midpoint(pointA, pointB);
    
    expect(mid.x).toBe(2);
    expect(mid.y).toBe(3);
  });

  it('should handle same points', () => {
    const pointA = { x: 5, y: 5 };
    const pointB = { x: 5, y: 5 };
    
    const mid = midpoint(pointA, pointB);
    
    expect(mid.x).toBe(5);
    expect(mid.y).toBe(5);
  });

  it('should handle negative coordinates', () => {
    const pointA = { x: -2, y: -4 };
    const pointB = { x: 4, y: 2 };
    
    const mid = midpoint(pointA, pointB);
    
    expect(mid.x).toBe(1);
    expect(mid.y).toBe(-1);
  });
});
