import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Bienvenido a la App</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Inicia sesión o regístrate para acceder a tu dashboard
        </p>
        <div className="space-x-4">
          <Link 
            href="/sign-in" 
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link 
            href="/sign-up" 
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Registrarme
          </Link>
        </div>
      </div>
    </div>
  );
} 