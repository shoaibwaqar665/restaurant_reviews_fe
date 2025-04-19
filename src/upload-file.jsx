import Papa from 'papaparse';
import React, { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useEffect, useState } from 'react';
import MatchesTable from './match-palyer';

function CsvReader() {
	const [data, setData] = useState([]);
	const [headers, setHeaders] = useState([]);
	const [uniqueMatches, setUniqueMatches] = useState([])
	const [uniquePositions, setUniquePositions] = useState([])
	const [budget, setBudget] = useState();
	const [totalDKSalary, setTotalDKSalary] = useState(0);
	const [filteredData, setFilteredData] = useState([]);
	const [totalPlayersData, setTotalPlayerData] = useState([])
	const [errorMessage, setErrorMessage] = useState("");
	const [loading, setLoading] = useState(false)
	let captainIndex = -1
	let viceCaptainIndex  = 1

	const [topMatchPlayer, setTopMatchPlayer] = useState([])

	const [newFileHeader] = useState([
		"Player",
		"Team",
		"Opp",
		"Minutes",
		"DK Position",
		"DK Salary",
		"DK Points",
		"DK Value",
		"DK Ceiling",
		"DK Own",
		"DK Slate"
	]);
	const excludedColumns = ["DK Ceiling", "DK Own", "DK Slate", "Minutes"];


	const addPositionCategories = () => {
		const defensivePositions = [];
		const midfieldPositions = [];
		const attackingPositions = [];

		// Classify positions
		positions.forEach(pos => {
			if (pos === "C" || pos === "PF/C" || pos === "SF/PF") {
				defensivePositions.push(pos);
			} else if (
				pos === "PG" ||
				pos === "SG" ||
				pos === "PG/SF" ||
				pos === "PG/SG" ||
				pos === "SF" ||
				pos === "SG/SF"
			) {
				midfieldPositions.push(pos);
			} else {
				attackingPositions.push(pos);
			}
		});
	}
	const getCaptainAndViceCaptain = (players, remainingBudget, multiplier) => {
		// const players = [
		// 	["Player1", "1000", "40"],
		// 	["Player2", "2000", "60"],
		// 	["Player3", "3000", "70"],
		// 	["Player4", "1500", "90"],
		// 	["Player5", "2500", "30"],

		// ];
		let salary15 = [];
		let value15 = [];
		let totalWeights = [];

		// Calculate adjusted salary and value for each player
		for (let i = 0; i < players.length; i++) {
			let player = players[i];
			let playerSalary = parseFloat(player[5].replace(',', '')); // Convert salary string to number
			let playerValue = parseFloat(player[7].replace(',', '')); // Convert value string to number
			salary15.push(playerSalary * multiplier);
			value15.push(playerValue * multiplier);
		}

		// Calculate total weight for each player
		for (let i = 0; i < players.length; i++) {
			let totalSalary = 0;
			let totalValue = 0;

			for (let j = 0; j < players.length; j++) {
				if (j !== i) {
					totalSalary += parseFloat(players[j][5].replace(',', '')); // Use original salary
					totalValue += parseFloat(players[j][7].replace(',', '')); // Use original value
				} else {
					totalSalary += salary15[i]; // Use adjusted salary for current player
					totalValue += value15[i]; // Use adjusted value for current player
				}
			}

			totalWeights.push(totalValue / totalSalary);
		}

		// Find the index with the maximum weight
		let maxWeightIndex = 0;
		for (let i = 1; i < totalWeights.length; i++) {
			if (totalWeights[i] > totalWeights[maxWeightIndex]) {
				maxWeightIndex = i;
			}
		}
		if(maxWeightIndex == captainIndex){
			maxWeightIndex = 1
		}
		let captain = players[maxWeightIndex]
		let SalaryDiff = salary15[maxWeightIndex] - parseFloat(captain[5].replace(',',''))
		if(multiplier == 1.5){
			captainIndex = maxWeightIndex
		}else{
			viceCaptainIndex = maxWeightIndex
		}
		return SalaryDiff
	};
	const knapsack = (players, budget) => {
		console.log("Budget: ", budget)
		const n = players.length;
		const playerDataWithProposition = [];
		for (let i = 0; i < n; i++) {
			let player = players[i];
			let Dk_Salary = parseFloat(player[5].replace(',', ''));
			let Dk_Value = parseFloat(player[7]);
			let proposition = Dk_Value / Dk_Salary;
			playerDataWithProposition.push({ ...player, proposition });
		}
		// Sort player data by proposition in descending order
		playerDataWithProposition.sort((a, b) => b.proposition - a.proposition);
		const selectedPlayers = [];
		let maxSumCombination = null;

		// Recursive function to generate combinations
		const generateCombinations = (start, combination, remainingBudget) => {
			if (combination.length === 6) {

				let salaryDiffCap = getCaptainAndViceCaptain(combination, remainingBudget, 1.5)
				let salaryDiffVCap = getCaptainAndViceCaptain(combination, remainingBudget, 1.2)
				let remBug = remainingBudget
				remainingBudget = remainingBudget - salaryDiffCap
				remainingBudget = remainingBudget - salaryDiffVCap

				if (remainingBudget >= 0) {

					// Calculate sum of DK Values,Proposition for each combination
					const sum = combination.reduce((acc, player) => acc + parseFloat(player["proposition"]), 0);
					if (!maxSumCombination || sum > maxSumCombination.sum) {
						maxSumCombination = { combination, sum };
					}
				}
				return;
			}
			for (let i = start; i < playerDataWithProposition.length; i++) {
				const player = playerDataWithProposition[i];
				const playerCost = parseFloat(player[5].replace(',', ''));
				if (remainingBudget - playerCost >= 0) {
					generateCombinations(i + 1, [...combination, player], remainingBudget - playerCost);
				}
			}
		};

		generateCombinations(0, [], budget);

		if (!maxSumCombination) {
			return null; // No valid combination found
		}
		return { maxSumCombination };
	};




	const selectTopPlayers = (matches, budget) => {
		const topPlayers = [];
		for (const matchKey in matches) {
			const selectedCombination = knapsack(matches[matchKey], budget);
			if (selectedCombination && selectedCombination?.maxSumCombination) {
				topPlayers.push({ matchKey, ...selectedCombination }); // Include matchKey in the object
			} else {
				console.error("Invalid or null selected players for match:", matchKey);
			}
		}


		return topPlayers;
	};

	const calculateTopPlayers = (uniqueMatches, playerData) => {
		for (const match in uniqueMatches) {
			uniqueMatches[match]?.sort((a, b) => (b[6] / b[5]) - (a[6] / a[5]));
		}
		// Select top 6 players from each match
		console.log("matchPlayers: ", uniqueMatches);
		const topPlayers = selectTopPlayers(uniqueMatches, budget);

		console.log("Top Players: ", topPlayers);
		console.log("Captain Index: " , captainIndex)
		console.log("V.Captain Index: " , viceCaptainIndex)

		console.log("Top Players: ", topPlayers[0]?.maxSumCombination?.combination?.length);
		setTopMatchPlayer(topPlayers)
		return topPlayers
	};


	const getMatchandPositions = (playersData) => {
		const uniquePositions = [];
		const uniqueMatches = {};

		// Initialize match keys in the uniqueMatches object
		uniqueMatches[playersData[1][1].toUpperCase() + " vs " + playersData[1][2].toUpperCase()] = [];
		for (let i = 1; i < playersData.length; i++) {
			const player = playersData[i];
			const position = player[4];
			if (!uniquePositions.includes(position)) {
				uniquePositions.push(position);
			}

			const team = player[1].toUpperCase();
			const opp = player[2].toUpperCase();
			const match = [team, opp].sort().join(" vs ");
			if (!uniqueMatches.hasOwnProperty(match)) {
				uniqueMatches[match] = [];
			}
			uniqueMatches[match].push(player);
		}
		setUniqueMatches(uniqueMatches);
		setUniquePositions(uniquePositions);

		const topPlayers = calculateTopPlayers(uniqueMatches, playersData)
		return topPlayers
	}

	const handleFileChange = (event) => {
		setErrorMessage("");
		const file = event.target.files[0];
		if (file) {
			setLoading(true)

			Papa.parse(file, {
				complete: (results) => {
					const rows = results.data;
					const playersData = getMatchandPositions(rows)
					setTotalPlayerData(playersData)
					console.log(results)
					if (rows.length > 0) {
						const headerIndexes = rows[0].map((header, index) => ({
							header,
							index
						})).filter(h => !excludedColumns.includes(h.header));

						const newHeaders = headerIndexes.map(h => h.header);
						setHeaders([...newHeaders, 'Calculated Value']);
						const newData = rows.slice(1).map(row => {
							const rowFiltered = headerIndexes.map(h => row[h.index]);
							const dvIndex = newHeaders.indexOf('DK Value');
							const dkIndex = newHeaders.indexOf('DK Salary');
							const dkSalary = parseFloat(rowFiltered[dkIndex].replace(/,/g, ''));
							const dvValue = parseFloat(rowFiltered[dvIndex]);
							const result = dkSalary ? (dvValue / dkSalary).toFixed(10) : 'N/A';
							return [...rowFiltered, result];
						});
						setData(newData);
						setLoading(false)

						calculateTotalDKSalary(newData, newHeaders);

					}

				},
				header: false,
				skipEmptyLines: true
			});

		}
	};

	const calculateTotalDKSalary = (newData, headers) => {
		const dkIndex = headers.indexOf('DK Salary');
		let total = 0;
		newData.forEach(row => {
			const dkValue = parseFloat(row[dkIndex].replace(/,/g, '')) || 0;
			total += dkValue;
		});
		setTotalDKSalary(total);
	};

	const handleTeamBudget = () => {
		if (data.length === 0) {
			setErrorMessage("Please select a CSV file first.");
		} else {
			filterDataByBudget();
		}
	};


	const filterDataByBudget = () => {
		const dkIndex = headers.indexOf('DK Salary');
		const cvIndex = headers.indexOf('Calculated Value');
		let currentTotal = 0;
		const candidates = [];

		data.forEach(row => {
			const salary = parseFloat(row[dkIndex].replace(/,/g, ''));
			if (currentTotal + salary <= parseFloat(budget)) {
				currentTotal += salary;
				candidates.push(row);
			}
		});

		if (candidates.length < 6) {
			setErrorMessage("Increase the budget to select at least 6 rows.");
			setFilteredData([]);
		} else {
			candidates.sort((a, b) => parseFloat(b[cvIndex]) - parseFloat(a[cvIndex]));
			const topCandidates = candidates.slice(0, 6);
			setFilteredData(topCandidates);
			setErrorMessage("");
		}
	};

	const HandleDownloadTemplates = () => {
		const csvContent = generateCsvContent();
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement("a");
		if (link.download !== undefined) {
			const url = URL.createObjectURL(blob);
			link.setAttribute("href", url);
			link.setAttribute("download", "template.csv");
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	const generateCsvContent = () => {
		// Combine headers and data to create CSV content
		let csvContent = newFileHeader.join(',') + '\n';
		data.forEach(row => {
			csvContent += row.join(',') + '\n';
		});
		return csvContent;
	};

	useEffect(() => {
		budget?.length === 0 ? setTopMatchPlayer([]) : ''
		budget?.length === 0 ? setData([]) : ''
	})

	const handleBudgetChange = (e) => {
		const value = e.target.value;

		if (!isNaN(value) && value.trim() !== '') {
			setBudget(value);
		} else {
			setBudget('');
			setData([]);
			if (fileInputRef.current) {
				fileInputRef.current.value = ""; // Reset file input
			}
		}
	};

	return (
		<div className="container mx-auto py-5 px-2">
			<style>
				{`
                    input[type='number']::-webkit-inner-spin-button,
                    input[type='number']::-webkit-outer-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    input[type='number'] {
                        -moz-appearance: textfield; /* Firefox */
                    }
                `}
			</style>
			<h1 className="text-3xl font-bold text-center mb-8">CSV Reader</h1>
			<div className="mb-6">
				<label htmlFor="budget" className="block text-sm font-medium text-gray-700">Budget</label>
				<input
					id="budget"
					type="number"
					placeholder="Enter budget"
					value={budget}
					onChange={handleBudgetChange}
					className="block w-full mt-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
				/>
			</div>
			{budget && (
				<div className="flex justify-center items-center mb-8">
					<input
						type="file"
						accept=".csv"
						onChange={handleFileChange}
						className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition duration-200 ease-in-out"
					/>
				</div>
			)}
			{errorMessage && (
				<div className="text-red-600 text-sm mb-4">
					{errorMessage}
				</div>
			)}

			{loading ? (
				<div className="flex justify-center items-center">
					<CircularProgress />
				</div>
			) : (
				<div className="table-container overflow-auto" style={{ maxHeight: '400px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(155, 155, 155, 0.5) rgba(255, 255, 255, 0.2)' }}>
					<table className="w-full text-sm text-black border-collapse border border-gray-300 rounded-md">
						<thead className="text-xs text-white uppercase bg-blue-600 sticky top-0">
							<tr>
								{headers.map((header, index) => (
									<th key={index} className="py-3 border border-gray-300">{header}</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-slate-200">
							{data.map((row, index) => (
								<tr key={index} className="border-b border-gray-300">
									{row.map((cell, i) => (
										<td key={i} className="py-4 px-6 border border-gray-300">{cell}</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<div className="flex justify-center mt-4">
				<button onClick={HandleDownloadTemplates} className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md ml-4 hover:bg-green-600 transition duration-200 ease-in-out">Download Template CSV</button>
			</div>
			{/* <div className="text-center mt-4 text-lg font-semibold text-gray-700">Total DK Salary: ${totalDKSalary}</div> */}
			{topMatchPlayer && (budget < 100 && budget > 1) ? (
				<div className="text-red-600 text-center mt-4">
					Error: Not enough match players. Minimum required is 6. Increase the budget
				</div>
			) : (
				<MatchesTable topMatchPlayer={topMatchPlayer} />
			)}

		</div>
	);

}

export default CsvReader;
