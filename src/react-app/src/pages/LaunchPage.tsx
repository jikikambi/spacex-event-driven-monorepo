import { useEffect, useState } from "react";
import { getLaunch } from "../api/spacexApi";

export default function LaunchPage() {
  const [launch, setLaunch] = useState<any>();

  useEffect(() => {
    getLaunch("5eb87d42ffd86e000604b384")
      .then(setLaunch)
      .catch(console.error);
  }, []);

  if (!launch) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{launch.name}</h1>
    </div>
  );
}