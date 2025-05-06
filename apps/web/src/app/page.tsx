import Image from 'next/image';

export default function Home() {
  const mensaje = 'Hola Mundo';
  const fecha = new Date().toLocaleDateString();

  return (
    <main className="flex flex-1 flex-col items-center justify-between p-8">
      <h1>{mensaje}</h1>
      <p>Fecha: {fecha}</p>
    </main>
  );
}
