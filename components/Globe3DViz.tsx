import React, { useEffect, useRef } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import * as THREE from 'three';
import { Coordinates } from '../types';

interface Globe3DVizProps {
  onLocationSelect: (coords: Coordinates) => void;
  selectedLocation: Coordinates | null;
}

const Globe3DViz: React.FC<Globe3DVizProps> = ({ onLocationSelect, selectedLocation }) => {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  // When selectedLocation changes, animate the globe to look at the new point
  useEffect(() => {
    if (selectedLocation && globeRef.current) {
      globeRef.current.pointOfView({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        altitude: 1.5 // Zoom level
      }, 1000); // 1s animation duration
    }
  }, [selectedLocation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (globeRef.current) {
        // Force a resize calculation if needed, though react-globe.gl handles this via props mostly
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initStarfield = () => {
    if (!globeRef.current) return;
    
    const scene = globeRef.current.scene();
    if (scene.getObjectByName('starfield')) return;

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    
    for(let i = 0; i < starCount; i++) {
      // Create stars in a large sphere around the globe (radius 300-800)
      const r = 300 + Math.random() * 500; 
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.name = 'starfield';
    scene.add(stars);
  };

  return (
    <div className="absolute inset-0 z-0 bg-black">
      <Globe
        ref={globeRef}
        onGlobeReady={initStarfield}
        // Use OpenStreetMap tiles
        globeTileEngineUrl={(x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`}
        
        // Visuals
        backgroundColor="#000000"
        showAtmosphere={true}
        atmosphereColor="#3a228a"
        atmosphereAltitude={0.2}
        
        // Interaction
        onGlobeClick={({ lat, lng }) => {
          onLocationSelect({ lat, lng });
        }}
        
        // Pin Rendering (using 3D Objects)
        objectsData={selectedLocation ? [selectedLocation] : []}
        objectLat="lat"
        objectLng="lng"
        objectAltitude={0.005} // Slightly above surface
        objectThreeObject={() => {
          // Create a custom 3D Pin
          const group = new THREE.Group();

          // 1. The Pin Stick (White)
          const stickGeom = new THREE.CylinderGeometry(0.2, 0.05, 4, 8);
          stickGeom.translate(0, 2, 0); // Pivot at bottom
          const stickMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
          const stick = new THREE.Mesh(stickGeom, stickMat);
          group.add(stick);

          // 2. The Pin Head (Red)
          const headGeom = new THREE.SphereGeometry(1.2, 16, 16);
          headGeom.translate(0, 4.5, 0); // Sit on top of stick
          const headMat = new THREE.MeshLambertMaterial({ color: 0xef4444, emissive: 0x550000 });
          const head = new THREE.Mesh(headGeom, headMat);
          group.add(head);

          // 3. Drop Shadow (Semi-transparent black circle at base)
          const shadowGeom = new THREE.CircleGeometry(1.5, 16);
          shadowGeom.rotateX(-Math.PI / 2);
          const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
          const shadow = new THREE.Mesh(shadowGeom, shadowMat);
          group.add(shadow);

          return group;
        }}
      />
    </div>
  );
};

export default Globe3DViz;