export default function Footer({ className = "" }) {
  return (
    <footer className={`bg-gray-200 text-center py-2 mt-auto ${className}`}>
      <div className="text-xl font-bold">TOOLOOP</div>
      <p className="text-gray-600 text-sm">Sick Six</p>
      <p className="text-orange-500 italic text-sm">Never Stop Looping!</p>
  
      {/* Reduce spacing here */}
      <div className="flex justify-center space-x-4 mt-2">
        <a href="#" className="text-gray-500 hover:text-black transition">
          Facebook
        </a>
        <a href="#" className="text-gray-500 hover:text-black transition">
          LinkedIn
        </a>
        <a href="#" className="text-gray-500 hover:text-black transition">
          YouTube
        </a>
        <a href="#" className="text-gray-500 hover:text-black transition">
          Instagram
        </a>
      </div>
    </footer>
  );
}