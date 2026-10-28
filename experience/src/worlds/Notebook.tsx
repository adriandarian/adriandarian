import { Atmosphere, Box } from "../scene/Models";
export { default as Controller } from "./NotebookController";
export default function Notebook() {
  return (
    <>
      <Atmosphere color="#d7c7a4" near={15} far={50} />
      <ambientLight intensity={1.7} />
      <directionalLight position={[-4, 10, 4]} intensity={2} color="#fff1ce" />
      <Box position={[0, -0.55, 0]} size={[80, 0.6, 80]} color="#9c8060" />
      <Box position={[0, -0.17, -0.5]} size={[10, 0.2, 8]} color="#815640" />
      {[-2.35, 2.35].map((x) => (
        <Box
          key={x}
          position={[x, 0, -0.5]}
          size={[4.55, 0.18, 7.6]}
          color="#eddfbb"
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <group key={i}>
          <Box
            position={[-2.35, 0.11, -3.6 + i * 0.45]}
            size={[3.7, 0.005, 0.015]}
            color="#cdbf9d"
          />
          <Box
            position={[2.35, 0.11, -3.6 + i * 0.45]}
            size={[3.7, 0.005, 0.015]}
            color="#cdbf9d"
          />
        </group>
      ))}
      <Box
        position={[0, 0.08, -0.5]}
        size={[0.09, 0.03, 7.6]}
        color="#b6a684"
      />
      <Box
        position={[3.6, 0.23, -2.6]}
        size={[0.12, 0.16, 2.4]}
        color="#454c43"
      />
    </>
  );
}
