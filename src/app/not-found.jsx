export default function NotFound() {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h1>Oops! Page Not Found</h1>
        <p>The page you are looking for does not exist or has been moved.</p>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go Back to Home
        </a>
      </div>
    );
  }
  