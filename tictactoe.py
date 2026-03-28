def print_board(board):
    for i, row in enumerate(board):
        print(" | ".join(row))
        if i < 2:
            print("---------")

def check_winner(board, player):
    for row in board:
        if all(cell == player for cell in row):
            return True
    for col in range(3):
        if all(board[row][col] == player for row in range(3)):
            return True
    if all(board[i][i] == player for i in range(3)):
        return True
    if all(board[i][2 - i] == player for i in range(3)):
        return True
    return False

def is_full(board):
    return all(cell != " " for row in board for cell in row)

def main():
    board = [[" "] * 3 for _ in range(3)]
    current = "X"

    print("\nTic-Tac-Toe!")
    print("Enter row and column (1-3), e.g. '1 2'\n")

    while True:
        print_board(board)
        print(f"\nPlayer {current}'s turn")

        try:
            row, col = map(int, input("Enter row col: ").split())
            row -= 1
            col -= 1
        except:
            print("Invalid input. Try again.\n")
            continue

        if not (0 <= row <= 2 and 0 <= col <= 2):
            print("Out of range. Use numbers 1-3.\n")
            continue

        if board[row][col] != " ":
            print("That spot is taken. Try again.\n")
            continue

        board[row][col] = current

        if check_winner(board, current):
            print_board(board)
            print(f"\nPlayer {current} wins!\n")
            break

        if is_full(board):
            print_board(board)
            print("\nIt's a draw!\n")
            break

        current = "O" if current == "X" else "X"

if __name__ == "__main__":
    main()
