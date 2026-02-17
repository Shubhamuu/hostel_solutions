const Income = require('../models/Income');

// SuperAdmin: Get comprehensive income analytics
exports.getIncomeAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // ── Run all queries in parallel — no reason to await sequentially ──
    const [totalIncomeAgg, monthlyIncomeAgg, recentTransactions, dailyIncome] =
      await Promise.all([

        // 1. All-time total
        Income.aggregate([
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),

        // 2. This month's total
        Income.aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),

        // 3. Recent transactions — project only what the client needs
        Income.find()
          .populate("hostelId", "name")
          .select("amount createdAt hostelId description")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(), // plain JS objects — faster, less memory

        // 4. Daily breakdown for the last 7 days
        Income.aggregate([
          { $match: { createdAt: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              total: { $sum: "$amount" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // ── Fill in missing days so the chart never has gaps ──────────────
    const dailyMap = Object.fromEntries(
      dailyIncome.map((d) => [d._id, d.total])
    );

    const filledDailyIncome = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i + 1);
      const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      return { date: key, total: Math.round((dailyMap[key] ?? 0) * 100) / 100 };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalIncome:   Math.round((totalIncomeAgg[0]?.total  ?? 0) * 100) / 100,
        monthlyIncome: Math.round((monthlyIncomeAgg[0]?.total ?? 0) * 100) / 100,
        recentTransactions,
        dailyIncome: filledDailyIncome,
      },
    });

  } catch (err) {
    console.error("[getIncomeAnalytics]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch income analytics",
    });
  }
};
