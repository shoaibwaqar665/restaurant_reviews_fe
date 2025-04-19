import React from 'react';

const MatchesTable = ({ topMatchPlayer }) => {
	return (
		<div>
			{topMatchPlayer.map((matchDetail, index) => (
				<div key={index} className="table-container overflow-auto" style={{ maxHeight: '400px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(155, 155, 155, 0.5) rgba(255, 255, 255, 0.2)' }}>
					<h3>{matchDetail.matchKey}</h3>
					<table className="w-full text-sm text-black border-collapse border border-gray-300 rounded-md">
						<thead className="text-xs text-white uppercase bg-blue-600 sticky top-0">
							<tr>
								<th>Player</th>
								<th>Team</th>
								<th>Opponent</th>
								<th>Position</th>
								<th>Minutes</th>
								<th>DK Salary</th>
								<th>DK Points</th>
							</tr>
						</thead>
						<tbody className="bg-slate-200">
							{matchDetail.maxSumCombination.combination.map((player, idx) => (
								<tr key={idx} className="border-b border-gray-300">
									<td className="py-4 px-6 border border-gray-300">{player['0']}</td>
									<td className="py-4 px-6 border border-gray-300">{player['1']}</td>
									<td className="py-4 px-6 border border-gray-300">{player['2']}</td>
									<td className="py-4 px-6 border border-gray-300">{player['4']}</td>
									<td className="py-4 px-6 border border-gray-300">{player['3']}</td>
									<td className="py-4 px-6 border border-gray-300">${player['5'].replace(/,/g, '')}</td>
									<td className="py-4 px-6 border border-gray-300">{player['6']}</td>
								</tr>
							))}
						</tbody>
					</table>
					<div>Total Points for Combination: {matchDetail.maxSumCombination.sum}</div>
				</div>
			))}
		</div>
	);

};

export default MatchesTable;
