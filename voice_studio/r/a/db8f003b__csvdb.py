import pandas as pd

class CSVDatabase:
    def __init__(self, file_path):
        self.file_path = file_path
        self.dataframe = pd.read_csv(file_path)
    
    def execute_command(self, command):
        # Implement your logic to modify the database based on the command
        # For example, you can use if-else statements or switch-case statements
        
        # Example command: "add_row,John,Doe,30"
        if command.startswith("add_row"):
            _, *values = command.split(",")
            new_row = pd.Series(values, index=self.dataframe.columns)
            self.dataframe = self.dataframe.append(new_row, ignore_index=True)
        
        # Example command: "delete_row,2"
        elif command.startswith("delete_row"):
            _, row_index = command.split(",")
            self.dataframe = self.dataframe.drop(int(row_index))
        
        # Add more commands as per your requirements
        elif command.startswith("add_column"):
            if command.count(",") != 3:
                print("Invalid command")
                return
            _, column_name, default_val = command.split(",")
            self.dataframe[column_name] = default_val
        else:
            print("Invalid command")
    
    def save_changes(self):
        self.dataframe.to_csv(self.file_path, index=False)