import React from "react";
import { Card } from "primereact/card";
import { Badge } from "primereact/badge";
import useLeaderboard from "../../Hooks/dashboard/useLeaderboard";
import Avatar from "../../Components/shared/avatar/Avatar"; 
import coins from "../../Assets/Icons/coins.svg"
import "./dashboard.css";

type Props = { limit?: number };

const LeaderboardCard: React.FC<Props> = ({ limit = 5 }) => {
  const { users, loading, error } = useLeaderboard(limit);

  return (
    <Card title="Top Earners" subTitle="Most coins this week" className="leaderboard-card p-card-shadow">
      {loading && <div className="text-500">Loading…</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && users.length === 0 && (
        <div className="text-500">No users yet.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <ul className="lb-list">
          {users.map((u, idx) => (
            <li key={u.id} className="lb-row">
            <div className="lb-left">
            <Badge value={idx + 1} className={`lb-rank lb-rank-${idx + 1}`}/>

                <Avatar filename={u.profilePicFilename ?? null} size={44} />
                <div className="lb-meta">
                  <div className="lb-name">{u.name}</div>
                </div>
              </div>
              <div className="lb-right">
                <img src={coins} alt="" className="lb-coin" />
                <span className="lb-coins">{u.coins}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default LeaderboardCard;
