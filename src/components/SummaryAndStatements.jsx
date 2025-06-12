import React, { useState, useEffect } from 'react';
import { ReceiptText } from 'lucide-react';
// All CSS is in index.css

// SummaryAndStatements Component
function SummaryAndStatements({ members, incomes, expenses, perPersonBudget }) { // Added perPersonBudget prop
  const [balances, setBalances] = useState([]);
  const [settlementSuggestions, setSettlementSuggestions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    if (members.length === 0) {
      setBalances([]);
      setSettlementSuggestions([]);
      setAllTransactions([]); // Reset transactions if no members
      return;
    }

    // Combine and sort all transactions
    const combinedTransactions = [
      ...incomes.map(item => ({
        ...item,
        type: 'income',
        displayAmount: `+$${item.amount.toFixed(2)}`, // For display
        payerOrReceiverId: item.memberId, // Who received income
        involvedMembers: [item.memberId], // Income is usually just for one member
        sortTimestamp: item.createdAt?.toDate().getTime() || new Date(item.date).getTime(),
      })),
      ...expenses.map(item => ({
        ...item,
        type: 'expense',
        displayAmount: `-$${item.amount.toFixed(2)}`, // For display
        payerOrReceiverId: item.paidByMemberId, // Who paid expense
        involvedMembers: item.includedMemberIds, // Who was included in expense
        sortTimestamp: item.createdAt?.toDate().getTime() || new Date(item.date).getTime(),
      }))
    ].sort((a, b) => a.sortTimestamp - b.sortTimestamp); // Sort by creation time or date

    setAllTransactions(combinedTransactions);

    const calculateBalances = () => {
      // Initialize balances for each member
      const memberBalances = members.reduce((acc, member) => ({
        ...acc,
        [member.id]: {
          name: member.name,
          totalExplicitIncome: 0, // Money they directly put into the fund
          totalPaidExpenses: 0,   // Money they paid for group expenses
          totalOwedShare: 0,      // Their share of all group expenses
          netBalance: 0,          // (Total Explicit Income + Total Paid Expenses) - Total Owed Share
          totalContributions: 0,  // Sum of totalExplicitIncome + totalPaidExpenses
        },
      }), {});

      // Process incomes (explicit contributions to the fund)
      incomes.forEach(income => {
        if (memberBalances[income.memberId]) {
          memberBalances[income.memberId].totalExplicitIncome += income.amount;
        }
      });

      // Process expenses
      expenses.forEach(expense => {
        const paidBy = expense.paidByMemberId;
        const amount = expense.amount;
        const includedMembers = expense.includedMemberIds;

        // Money paid by member for an expense counts as their contribution
        if (memberBalances[paidBy]) {
          memberBalances[paidBy].totalPaidExpenses += amount;
        }

        // Calculate share per person. Handle potential division by zero if includedMembers is empty.
        const sharePerPerson = includedMembers.length > 0 ? amount / includedMembers.length : 0;
        includedMembers.forEach(includedId => {
          if (memberBalances[includedId]) {
            memberBalances[includedId].totalOwedShare += sharePerPerson;
          }
        });
      });

      // Calculate net balance and total contributions for display
      const calculatedBalances = members.map(member => {
        const balance = memberBalances[member.id];
        // Total contributions is explicit income PLUS money they paid for expenses
        balance.totalContributions = balance.totalExplicitIncome + balance.totalPaidExpenses;

        // Net balance is total contributions MINUS their share of expenses
        balance.netBalance = balance.totalContributions - balance.totalOwedShare;
        return balance;
      });

      setBalances(calculatedBalances);
      calculateSettlementSuggestions(calculatedBalances);
    };

    const calculateSettlementSuggestions = (currentBalances) => {
      // Filter out members with zero or negligible balance
      let netAmounts = currentBalances.map(member => ({
        id: members.find(m => m.name === member.name)?.id, // Ensure we get the actual ID if needed, though name is used for display here
        name: member.name,
        amount: member.netBalance,
      })).filter(m => Math.abs(m.amount) > 0.01); // Filter out near-zero balances

      let payers = netAmounts.filter(m => m.amount > 0).sort((a, b) => b.amount - a.amount); // Those who are owed (positive balance)
      let receivers = netAmounts.filter(m => m.amount < 0).sort((a, b) => a.amount - b.amount); // Those who owe (negative balance)

      const suggestions = [];

      let i = 0; // index for payers
      let j = 0; // index for receivers

      while (i < payers.length && j < receivers.length) {
        let payer = payers[i];
        let receiver = receivers[j];

        const amountToSettle = Math.min(payer.amount, Math.abs(receiver.amount));

        suggestions.push({
          from: receiver.name,
          to: payer.name,
          amount: amountToSettle.toFixed(2),
        });

        payer.amount -= amountToSettle;
        receiver.amount += amountToSettle; // receiver.amount is negative, so adding makes it less negative (closer to zero)

        if (Math.abs(payer.amount) < 0.01) {
          i++; // Payer has settled their debt (or received what they were owed)
        }
        if (Math.abs(receiver.amount) < 0.01) {
          j++; // Receiver has paid off their share
        }
      }
      setSettlementSuggestions(suggestions);
    };

    calculateBalances();
  }, [members, incomes, expenses]); // Depend on all data sources

  const getMemberName = (id) => members.find(m => m.id === id)?.name || 'Unknown Member';

  return (
    <div className="summary-container card">
      <h3 className="summary-heading">
        <ReceiptText size={22} /> Trip Summary & Balances
      </h3>

      {members.length === 0 ? (
        <p className="no-summary-message">No members added yet. Add members, income, and expenses to see the summary.</p>
      ) : (
        <>
          <h4 className="summary-section-title">All Transactions</h4>
          {allTransactions.length === 0 ? (
            <p className="no-summary-message">No transactions recorded yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Member(s)</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allTransactions.map((transaction, index) => (
                    <tr key={transaction.id || index}> {/* Use ID if available, else index */}
                      <td>{index + 1}</td>
                      <td>
                        <span className={`font-semibold ${transaction.type === 'income' ? 'balance-positive' : 'balance-negative'}`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td>
                        {transaction.type === 'income'
                          ? getMemberName(transaction.payerOrReceiverId)
                          : `${getMemberName(transaction.payerOrReceiverId)} paid for ${transaction.involvedMembers.map(getMemberName).join(', ')}`
                        }
                      </td>
                      <td className={transaction.type === 'income' ? 'balance-positive' : 'balance-negative'}>
                        {transaction.displayAmount}
                      </td>
                      <td>{transaction.paymentMethod || 'N/A'}</td>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4 className="summary-section-title">Individual Balances</h4>
          <div className="table-wrapper">
            <table className="data-table balance-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Total Contributions</th> {/* Changed from Total Income */}
                  <th>Their Share of Expenses</th>
                  <th>Net Balance</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance, index) => (
                  <tr key={index}>
                    <td>{balance.name}</td>
                    <td className="balance-positive">${balance.totalContributions.toFixed(2)}</td> {/* Display total contributions */}
                    <td className="balance-negative">${balance.totalOwedShare.toFixed(2)}</td> {/* Renamed for clarity */}
                    <td className={balance.netBalance >= 0 ? 'balance-positive' : 'balance-negative'}>
                      ${balance.netBalance.toFixed(2)} {balance.netBalance >= 0 ? '(Owed to them)' : '(Owes)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {perPersonBudget > 0 && (
            <div className="budget-summary">
              <h4 className="summary-section-title" style={{ marginTop: '0', borderBottom: 'none', paddingBottom: '0' }}>
                Per-Person Budget Summary: ${perPersonBudget.toFixed(2)} / person
              </h4>
              {balances.map((balance, index) => {
                const remaining = perPersonBudget - balance.totalContributions;
                return (
                  <p key={`budget-${index}`}>
                    <strong>{balance.name}:</strong> Total contributed: ${balance.totalContributions.toFixed(2)}.
                    {remaining > 0 ? (
                      <span className="budget-status-negative"> Still needs to contribute ${remaining.toFixed(2)}.</span>
                    ) : (
                      <span className="budget-status-positive"> Met budget! {remaining < 0 ? ` (Over by $${Math.abs(remaining).toFixed(2)})` : ''}.</span>
                    )}
                  </p>
                );
              })}
            </div>
          )}

          <h4 className="summary-section-title">Settlement Suggestions (Splitwise)</h4>
          {settlementSuggestions.length === 0 ? (
            <p className="no-summary-message">Everyone is settled!</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table settlement-table">
                <thead>
                  <tr>
                    <th>Owes</th>
                    <th>Pays</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {settlementSuggestions.map((sug, index) => (
                    <tr key={index}>
                      <td>{sug.from}</td>
                      <td>{sug.to}</td>
                      <td className="balance-negative">${sug.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SummaryAndStatements;
