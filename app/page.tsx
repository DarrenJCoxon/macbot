import Chat from './components/Chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-6">Macbot</h1>
        <h2 className="text-xl text-center mb-10">Your AI Shakespeare Study Assistant</h2>
        <Chat />
      </div>
    </main>
  );
}