<?php

namespace App\Console\Commands;

use App\Support\IncomeExpenditureCumulativeCalculator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReportBalanceSheetGapCommand extends Command
{
    protected $signature = 'report:balance-sheet-gap {as_on_date? : Date Y-m-d (default: today)}';

    protected $description = 'Explain the Balance Sheet gap: equity implied by assets vs surplus from Income & Expenditure rules';

    public function handle(): int
    {
        $asOnDate = $this->argument('as_on_date') ?? now()->toDateString();

        $ie = IncomeExpenditureCumulativeCalculator::totalsToDate($asOnDate);

        $totalFundIn = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_in')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $totalFundOut = DB::table('hospital_fund_transactions')
            ->where('type', 'fund_out')
            ->where('date', '<=', $asOnDate)
            ->sum('amount');

        $fund = $totalFundIn - $totalFundOut;

        $this->info("As on: {$asOnDate}");
        $this->newLine();
        $this->line('Income & Expenditure rules (same as Balance Sheet “Surplus” row):');
        $this->line('  Total income (cumulative): '.number_format($ie['total_income'], 2));
        $this->line('  Total expenditure (cumulative): '.number_format($ie['total_expenditure'], 2));
        $this->line('  Surplus / (Deficit): '.number_format($ie['net_profit'], 2));
        $this->newLine();
        $this->line('Fund (Fund In − Fund Out): '.number_format($fund, 2));
        $this->newLine();
        $this->comment('Accounting identity: Assets = Liabilities + Fund + Surplus.');
        $this->comment('If you compute Equity IMPLIED = Total Assets − Total Liabilities − Fund from the Balance Sheet,');
        $this->comment('and compare to the Surplus line above, any difference is the “gap”.');
        $this->newLine();
        $this->warn('Why a gap is normal:');
        $this->line('  • Surplus uses the Income & Expenditure report (medicine/optics = profit from sales−COGS, not full cash).');
        $this->line('  • Bank balance uses all hospital income/expense transactions (full cash for medicine/optics sales).');
        $this->line('  • Medicine and optics stock values are inventory valuations; they do not need to match the gap line-by-line.');
        $this->newLine();
        $this->info('IncomeExpenditureController is not “wrong” if cumulative (to this date) matches the numbers above —');
        $this->info('that logic is shared via IncomeExpenditureCumulativeCalculator with the Balance Sheet.');

        return self::SUCCESS;
    }
}
