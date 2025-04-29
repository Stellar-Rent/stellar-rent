import Image from 'next/image';

export default function Home() {
  const mensaje = 'Hola Mundo';
  const fecha = new Date().toLocaleDateString();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
      <h1 className="text-4xl font-bold">{mensaje}</h1>
      <p className="mt-4 text-lg">Fecha: {fecha}</p>
      <div className="mt-8 p-4 rounded bg-gray-200 dark:bg-gray-800">
        This box should change color when you toggle the theme.
      </div>
    </main>
  );
}
