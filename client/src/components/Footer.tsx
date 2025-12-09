export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 py-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
        <p>
          © {new Date().getFullYear()} Achu's SFTP. All rights reserved.
        </p>
      </div>
    </footer>
  );
}