declare module '@cyber-edu/core-wasm' {
  export function init(): void;
  export function process_command(command: string, args: string): string;
  export function get_version(): string;
  export function health_check(): boolean;
  export function scan_host(args: string): string;
  export function ping_host(args: string): string;
  export function http_get(args: string): string;
  export function hash_data(args: string): string;
  export function encrypt_data(args: string): string;
  export function decrypt_data(args: string): string;
  export function generate_key(args: string): string;
  export function analyze(args: string): string;
  export function search(args: string): string;
  export function list_directory(args: string): string;
  export function read_file(args: string): string;
  export function create_directory(args: string): string;
  export function create_file(args: string): string;
  export function submit_flag(args: string): string;
  export function check_flag(args: string): string;
  export function check_rate(args: string): string;
  export function reset_rate(args: string): string;
  export default function init(): Promise<void>;
}
