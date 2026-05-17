<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreHolidayRequest;
use App\Http\Requests\Attendance\UpdateHolidayRequest;
use App\Models\Holiday;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        $holidays = Holiday::query()->orderByDesc('observed_on')->paginate(20);

        return Inertia::render('Attendance/Holidays', [
            'holidays' => $holidays,
        ]);
    }

    public function store(StoreHolidayRequest $request): RedirectResponse
    {
        Holiday::query()->create($request->validated());

        return redirect()->route('attendance.holidays.index')
            ->with('success', 'Holiday added.');
    }

    public function update(UpdateHolidayRequest $request, Holiday $holiday): RedirectResponse
    {
        $holiday->update($request->validated());

        return redirect()->route('attendance.holidays.index')
            ->with('success', 'Holiday updated.');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        $holiday->delete();

        return redirect()->route('attendance.holidays.index')
            ->with('success', 'Holiday removed.');
    }
}
