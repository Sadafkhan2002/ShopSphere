import { useEffect, useState } from "react";
import { getProducts } from "../services/productService";

function ApiTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const testConnection = async () => {
      try {
        const data = await getProducts();
        setResult(data);
      } catch (err) {
        console.error("API connection error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to connect to backend",
        );
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold">
          ShopSphere API Connection Test
        </h1>

        {loading && <p className="text-blue-600">Connecting to backend...</p>}

        {error && (
          <div className="rounded bg-red-100 p-4 text-red-700">
            Connection failed: {error}
          </div>
        )}

        {result && (
          <div>
            <p className="mb-4 font-semibold text-green-600">
              Backend connected successfully!
            </p>

            <pre className="overflow-auto rounded bg-neutral-900 p-5 text-sm text-white">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiTest;
