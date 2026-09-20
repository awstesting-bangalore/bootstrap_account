import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

/*
 * -----------------------------------------------------------------------------------------------------------
 * Bootstrapping New AWS Account with Initial Security Configurations (Set Account Alias and Password Policy).
 * -----------------------------------------------------------------------------------------------------------
 *
 * CUMULATIVE-STACK BEHAVIOR:
 *
 * - Once Stage 2 is enabled, these resources are ALWAYS declared on every later
 *   Stage 3 / Stage 4 / Stage 5 run.
 * - Do NOT use the custom DRY_RUN environment variable to remove resources from
 *   the Pulumi resource graph.
 * - Native `pulumi preview` is the dry run. pulumi.runtime.isDryRun() is exposed
 *   only as an informational output.
 *
 * The default AWS provider is supplied by the consuming account stack:
 *
 * Stage 2 / Stage 3:
 *   OrganizationAccountAccessRole
 *
 * Stage 4+:
 *   permanent target-account automation role
 */

export interface BootstrapNewAccountArgs {
    accountId: pulumi.Input<string>;
    accountName?: pulumi.Input<string>;
    accountAlias?: pulumi.Input<string>;
}

export class BootstrapNewAccount extends pulumi.ComponentResource {
    public readonly accountId: pulumi.Output<string>;
    public readonly accountName: pulumi.Output<string>;
    public readonly accountAlias: pulumi.Output<string>;
    public readonly actionsTaken: pulumi.Output<string[]>;
    public readonly warnings: pulumi.Output<string[]>;
    public readonly dryRun: pulumi.Output<boolean>;

    constructor(
        name: string,
        args: BootstrapNewAccountArgs,
        opts?: pulumi.ComponentResourceOptions,
    ) {
        super(
            "aenetworks:aws:BootstrapNewAccount",
            name,
            {},
            opts,
        );

        this.accountId =
            pulumi.output(args.accountId);

        this.accountName =
            pulumi.output(
                args.accountName ?? "",
            );

        this.accountAlias =
            pulumi.output(
                args.accountAlias ?? "",
            );

        // Native Pulumi preview state only. This does NOT change the
        // resource graph.
        this.dryRun =
            pulumi.output(
                pulumi.runtime.isDryRun(),
            );

        const actionsTaken:
            pulumi.Output<string>[] = [];

        const warnings:
            pulumi.Output<string>[] = [];

        if (args.accountAlias) {
            new aws.iam.AccountAlias(
                "accountAlias",
                {
                    accountAlias:
                        args.accountAlias,
                },
                {
                    parent:
                        this,
                },
            );

            actionsTaken.push(
                pulumi.interpolate`Created/managed Account Alias '${args.accountAlias}'`,
            );
        } else {
            warnings.push(
                pulumi.output(
                    "No account_alias provided; account alias is not managed",
                ),
            );
        }

        new aws.iam.AccountPasswordPolicy(
            "accountPasswordPolicy",
            {
                minimumPasswordLength:
                    14,
                requireSymbols:
                    true,
                requireNumbers:
                    true,
                requireUppercaseCharacters:
                    true,
                requireLowercaseCharacters:
                    true,
                allowUsersToChangePassword:
                    true,
                hardExpiry:
                    false,
                maxPasswordAge:
                    90,
                passwordReusePrevention:
                    24,
            },
            {
                parent:
                    this,
            },
        );

        actionsTaken.push(
            pulumi.output(
                "Created/managed Account Password Policy",
            ),
        );

        this.actionsTaken =
            pulumi.all(actionsTaken);

        this.warnings =
            pulumi.all(warnings);

        this.registerOutputs({
            accountId:
                this.accountId,
            accountName:
                this.accountName,
            accountAlias:
                this.accountAlias,
            actionsTaken:
                this.actionsTaken,
            warnings:
                this.warnings,
            dryRun:
                this.dryRun,
        });
    }
}
