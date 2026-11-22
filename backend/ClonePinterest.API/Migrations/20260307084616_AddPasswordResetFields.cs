using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClonePinterest.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // EmailNotifications вже існує, не додаємо!
            // migrationBuilder.AddColumn<bool>(
            //     name: "EmailNotifications",
            //     table: "Users",
            //     type: "INTEGER",
            //     nullable: false,
            //     defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PasswordResetCode",
                table: "Users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordResetCodeSentAt",
                table: "Users",
                type: "TEXT",
                nullable: true);

            // PushNotifications вже існує, не додаємо!
            // migrationBuilder.AddColumn<bool>(
            //     name: "PushNotifications",
            //     table: "Users",
            //     type: "INTEGER",
            //     nullable: false,
            //     defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // EmailNotifications вже існує, не видаляємо!
            // migrationBuilder.DropColumn(
            //     name: "EmailNotifications",
            //     table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordResetCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PasswordResetCodeSentAt",
                table: "Users");

            // PushNotifications вже існує, не видаляємо!
            // migrationBuilder.DropColumn(
            //     name: "PushNotifications",
            //     table: "Users");
        }
    }
}
