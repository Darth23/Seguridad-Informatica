//! Analytics Engine module for WASM
//! Provides analytics computation: skill breakdown, streaks, metrics

use wasm_bindgen::prelude::*;
use crate::CommandResponse;
use std::collections::HashMap;

/// Calculate skill breakdown from lesson completion data
/// Input format: "lesson1:skill1:time1,lesson2:skill2:time2,..."
#[wasm_bindgen]
pub fn analytics_skill_breakdown(args: &str) -> String {
    let response = analytics_skill_breakdown_impl(args);
    serialize_response(&response)
}

pub fn analytics_skill_breakdown_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error(
            "Usage: analytics_skills <lesson:skill:time,...>".to_string()
        );
    }

    let mut skill_times: HashMap<String, f64> = HashMap::new();

    for entry in args.split(',') {
        let parts: Vec<&str> = entry.splitn(3, ':').collect();
        if parts.len() >= 3 {
            let skill = parts[1].to_string();
            let time: f64 = parts[2].parse().unwrap_or(0.0);
            *skill_times.entry(skill).or_insert(0.0) += time;
        }
    }

    if skill_times.is_empty() {
        return CommandResponse::error("No valid skill data found".to_string());
    }

    let total_time: f64 = skill_times.values().sum();
    let mut output = String::from("=== Skill Breakdown ===\n\n");

    let mut skills: Vec<_> = skill_times.iter().collect();
    skills.sort_by(|a, b| b.1.partial_cmp(a.1).unwrap());

    for (skill, time) in &skills {
        let pct = (*time / total_time * 100.0) as i32;
        let bar_len = (pct / 5) as usize;
        let bar: String = "█".repeat(bar_len);
        output.push_str(&format!("  {:<20} {:>5.1}s ({:>3}%) {}\n", skill, time, pct, bar));
    }

    output.push_str(&format!("\n  Total: {:.1}s across {} skills", total_time, skill_times.len()));

    CommandResponse::success(output)
}

/// Calculate daily streaks from activity data
/// Input format: "date1:active,date2:active,..." (active = 1 or 0)
#[wasm_bindgen]
pub fn analytics_calculate_streaks(args: &str) -> String {
    let response = analytics_calculate_streaks_impl(args);
    serialize_response(&response)
}

pub fn analytics_calculate_streaks_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error(
            "Usage: analytics_streaks <date:active,...>".to_string()
        );
    }

    let entries: Vec<(&str, bool)> = args.split(',')
        .filter_map(|e| {
            let parts: Vec<&str> = e.splitn(2, ':').collect();
            if parts.len() == 2 {
                let active = parts[1].trim() == "1";
                Some((parts[0], active))
            } else {
                None
            }
        })
        .collect();

    if entries.is_empty() {
        return CommandResponse::error("No valid activity data found".to_string());
    }

    let mut current_streak = 0;
    let mut longest_streak = 0;
    let mut temp_streak = 0;

    for (_, active) in &entries {
        if *active {
            temp_streak += 1;
            if temp_streak > longest_streak {
                longest_streak = temp_streak;
            }
        } else {
            temp_streak = 0;
        }
    }

    // Current streak: count consecutive active days from the end
    for (_, active) in entries.iter().rev() {
        if *active {
            current_streak += 1;
        } else {
            break;
        }
    }

    let total_active = entries.iter().filter(|(_, a)| *a).count();
    let total_days = entries.len();

    let output = format!(
        "=== Streak Analysis ===\n\n\
         Current streak:  {} days\n\
         Longest streak:  {} days\n\
         Active days:     {}/{}\n\
         Activity rate:   {:.1}%",
        current_streak,
        longest_streak,
        total_active,
        total_days,
        (total_active as f64 / total_days as f64 * 100.0)
    );

    CommandResponse::success(output)
}

/// Calculate time-based metrics
/// Input format: "lesson_id:time_spent:completed,..."
#[wasm_bindgen]
pub fn analytics_time_metrics(args: &str) -> String {
    let response = analytics_time_metrics_impl(args);
    serialize_response(&response)
}

pub fn analytics_time_metrics_impl(args: &str) -> CommandResponse {
    if args.is_empty() {
        return CommandResponse::error(
            "Usage: analytics_time <lesson:time:completed,...>".to_string()
        );
    }

    let mut total_time = 0.0;
    let mut completed_count = 0;
    let mut total_count = 0;
    let mut fastest_time = f64::MAX;
    let mut slowest_time = 0.0;

    for entry in args.split(',') {
        let parts: Vec<&str> = entry.splitn(3, ':').collect();
        if parts.len() >= 2 {
            let time: f64 = parts[1].parse().unwrap_or(0.0);
            let completed = parts.get(2).map(|c| *c == "1").unwrap_or(false);

            total_time += time;
            total_count += 1;
            if completed { completed_count += 1; }
            if time > 0.0 && time < fastest_time { fastest_time = time; }
            if time > slowest_time { slowest_time = time; }
        }
    }

    if total_count == 0 {
        return CommandResponse::error("No valid time data found".to_string());
    }

    let avg_time = total_time / total_count as f64;
    let completion_rate = (completed_count as f64 / total_count as f64 * 100.0) as i32;

    let output = format!(
        "=== Time Metrics ===\n\n\
         Total time:     {:.1}s\n\
         Average time:   {:.1}s\n\
         Fastest:        {:.1}s\n\
         Slowest:        {:.1}s\n\
         Lessons:        {} total, {} completed ({}%)\n\
         Est. hours:     {:.1}h",
        total_time, avg_time,
        if fastest_time == f64::MAX { 0.0 } else { fastest_time },
        slowest_time,
        total_count, completed_count, completion_rate,
        total_time / 3600.0
    );

    CommandResponse::success(output)
}

fn serialize_response(response: &CommandResponse) -> String {
    serde_json::to_string(response).unwrap_or_else(|e| {
        serde_json::to_string(&CommandResponse::error(format!("Serialization error: {}", e)))
            .unwrap()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_skill_breakdown() {
        let result = analytics_skill_breakdown_impl("l1:network:30,l2:crypto:45,l3:network:20");
        assert!(result.success);
        assert!(result.output.contains("network"));
        assert!(result.output.contains("crypto"));
    }

    #[test]
    fn test_streak_calculation() {
        let result = analytics_calculate_streaks_impl("2024-01-01:1,2024-01-02:1,2024-01-03:1,2024-01-04:0,2024-01-05:1");
        assert!(result.success);
        assert!(result.output.contains("Current streak:  1 days"));
        assert!(result.output.contains("Longest streak:  3 days"));
    }

    #[test]
    fn test_time_metrics() {
        let result = analytics_time_metrics_impl("l1:30:1,l2:45:1,l3:20:0");
        assert!(result.success);
        assert!(result.output.contains("Total time"));
    }

    #[test]
    fn test_empty_input() {
        let result = analytics_skill_breakdown_impl("");
        assert!(!result.success);
    }
}
